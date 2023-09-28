package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/james4k/rcon"
	"github.com/joho/godotenv"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	// setup env
	envErr := godotenv.Load(".env")
	if envErr != nil {
		panic(envErr)
	}

	port := os.Getenv("PORT")

	// setup http router
	router := gin.Default()
	router.Use(gin.Recovery())

	publicDirPath := "./public"
	outputFilePath := "./out/"

	// build client components
	clientComponentsPath := "./public/components/client"

	clientComponentFiles, err := os.ReadDir(clientComponentsPath)
	if err != nil {
		panic("Failed to read client components dir.")
	}

	components := ""
	componentsCss := ""
	componentsJs := ""

	for _, file := range clientComponentFiles {
		if !file.IsDir() {
			if strings.Contains(file.Name(), ".html") {
				componentName := strings.Split(file.Name(), ".html")[0]

				componentFilePath := clientComponentsPath + "/" + componentName

				componentHtmlBytes, htmlErr := os.ReadFile(componentFilePath + ".html")
				componentCssBytes, cssErr := os.ReadFile(componentFilePath + ".css")
				componentJsBytes, jsErr := os.ReadFile(componentFilePath + ".js")

				component := ""
				args := []string{}

				if htmlErr != nil {
					panic("Failed to read html component file \"" + componentName + "\"")
				}
				componentHtml := string(componentHtmlBytes)
				for _, arg := range strings.Split(componentHtml, "{{ ")[1:] {
					arg = strings.Split(arg, " }}")[0]
					componentHtml = strings.ReplaceAll(componentHtml, "{{ "+arg+" }}", "${"+arg+"}")
					if !stringInList(args, strings.Split(arg, ".")[0]) {
						args = append(args, strings.Split(arg, ".")[0])
					}
				}
				component += componentHtml

				componentCss := ""
				if cssErr == nil && string(componentCssBytes) != "" {
					componentCss = string(componentCssBytes)
					componentsCss += "<style component=\"" + componentName + "\" client>\n" + componentCss + "\n</style>\n"
				}

				componentJs := ""
				if jsErr == nil && string(componentJsBytes) != "" {
					componentJs = string(componentJsBytes)
					componentsJs += "<script component=\"" + componentName + "\" client>\n" + componentJs + "\n</script>\n"
				}

				components += "const " + componentName + "_component = (" + strings.Join(args, ",") + ") => { return `" + component + "` }\n\n"
			}
		}
	}

	// get server components
	serverComponentNames := []string{}
	serverComponents := []string{}
	serverComponentStyles := []string{}
	serverComponentScripts := []string{}

	serverComponentsPath := "./public/components/server"

	serverComponentFiles, err := os.ReadDir(serverComponentsPath)
	if err != nil {
		panic("Failed to read server components dir.")
	}

	for _, file := range serverComponentFiles {
		if !file.IsDir() {
			if strings.Contains(file.Name(), ".html") {
				componentName := strings.Split(file.Name(), ".html")[0]

				component := ""

				componentHtmlBytes, componentHtmlErr := os.ReadFile(serverComponentsPath + "/" + componentName + ".html")
				componentCssBytes, componentCssErr := os.ReadFile(serverComponentsPath + "/" + componentName + ".css")
				componentJsBytes, componentJsErr := os.ReadFile(serverComponentsPath + "/" + componentName + ".js")

				if componentHtmlErr != nil {
					panic("Failed to read server component " + file.Name())
				}
				component = string(componentHtmlBytes)

				if componentCssErr == nil && string(componentCssBytes) != "" {
					serverComponentStyles = append(serverComponentStyles, "\n<style component=\""+componentName+"\" server>\n"+string(componentCssBytes)+"\n</style>")
				}

				if componentJsErr == nil && string(componentJsBytes) != "" {
					serverComponentScripts = append(serverComponentScripts, "\n<script component=\""+componentName+"\" server>\n"+string(componentJsBytes)+"\n</script>")
				}

				serverComponentNames = append(serverComponentNames, componentName)
				serverComponents = append(serverComponents, component)
			}
		}
	}

	// stitch global files
	globalCssFileDir := publicDirPath + "/css/global"
	globalCss := ""

	globalCssFiles, err := os.ReadDir(globalCssFileDir)
	if err != nil {
		panic("Failed to read global css dir.")
	}

	for _, file := range globalCssFiles {
		if !file.IsDir() {
			if strings.Contains(file.Name(), ".css") {
				cssBytes, cssErr := os.ReadFile(globalCssFileDir + "/" + file.Name())
				if cssErr != nil {
					panic("Failed to read page html file " + file.Name())
				}
				globalCss += "\n<style file=\"" + file.Name() + "\" global>\n" + string(cssBytes) + "\n</style>"
			}
		}
	}

	globJsFileDir := publicDirPath + "/js/global"
	globalJs := ""

	globJsFiles, err := os.ReadDir(globJsFileDir)
	if err != nil {
		panic("Failed to read global js dir.")
	}

	for _, file := range globJsFiles {
		if !file.IsDir() {
			if strings.Contains(file.Name(), ".js") {
				jsBytes, jsErr := os.ReadFile(globJsFileDir + "/" + file.Name())
				if jsErr != nil {
					panic("Failed to read page html file " + file.Name())
				}
				globalJs += "\n<script file=\"" + file.Name() + "\" global>\n" + string(jsBytes) + "\n</script>"
			}
		}
	}

	// build pages
	htmlFileDir := publicDirPath + "/html"
	publicHtmlFiles, err := os.ReadDir(htmlFileDir)
	if err != nil {
		panic("Failed to read public html dir.")
	}

	for _, file := range publicHtmlFiles {
		if !file.IsDir() {
			if strings.Contains(file.Name(), ".html") {
				pageName := strings.Split(file.Name(), ".html")[0]

				page := ""

				pageHtmlBytes, htmlErr := os.ReadFile(publicDirPath + "/html/" + pageName + ".html")
				pageCssBytes, cssErr := os.ReadFile(publicDirPath + "/css/" + pageName + ".css")
				pageJsBytes, jsErr := os.ReadFile(publicDirPath + "/js/" + pageName + ".js")

				if htmlErr != nil {
					panic("Failed to read page html file " + pageName)
				}
				page += string(pageHtmlBytes)

				if cssErr == nil && string(pageCssBytes) != "" {
					page += "\n<style>\n" + string(pageCssBytes) + "\n</style>\n"
				}

				if jsErr == nil && string(pageJsBytes) != "" {
					page += "\n<script>\n" + string(pageJsBytes) + "\n</script>\n"
				}

				page += globalCss
				page += globalJs
				page += "\n<script components>\n" + components + "\n</script>\n"
				page += componentsCss
				page += componentsJs

				for _, serverComponentStyle := range serverComponentStyles {
					page += serverComponentStyle
				}
				for _, serverComponentScript := range serverComponentScripts {
					page += serverComponentScript
				}

				os.Remove(outputFilePath + pageName + ".html")
				os.WriteFile(outputFilePath+pageName+".html", []byte(page), os.ModeAppend)
			}
		}
	}

	router.GET("/", func(c *gin.Context) {
		pageHtml := getPageHtml("index", outputFilePath, serverComponentNames, serverComponents)
		if pageHtml == "" {
			c.Status(http.StatusNotFound)
			return
		}

		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, pageHtml)
	})

	router.GET("/:page", func(c *gin.Context) {
		page := c.Param("page")

		if page == "index" {
			c.Redirect(http.StatusPermanentRedirect, "/")
		}

		pageHtml := getPageHtml(page, outputFilePath, serverComponentNames, serverComponents)
		if pageHtml == "" {
			c.Status(http.StatusNotFound)
			return
		}

		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, pageHtml)
	})

	router.GET("/ws", func(c *gin.Context) {
		handleWebSocket(c.Writer, c.Request)
	})

	SERVER_PASSWORD = os.Getenv("PASSWORD")

	if SERVER_PASSWORD != "" {
		fmt.Println("Loaded server password from .env")
	}

	router.Static("/assets", "./public/assets")

	err = router.Run(":" + port)
	if err != nil {
		panic(err)
	}
}

func getPageHtml(page string, outputFilePath string, serverComponentNames []string, serverComponents []string) string {
	filePath := outputFilePath + page + ".html"

	err := os.Chmod(filePath, 0777)
	if err != nil {
		fmt.Println(err)
	}

	pageBytes, err := os.ReadFile(filePath)
	if err != nil {
		return ""
	}

	pageHtml := string(pageBytes)

	if page == "index" {
		page = "Home"
	}

	i := 0
	for _, componentName := range serverComponentNames {
		component := serverComponents[i]
		component = strings.ReplaceAll(component, "{{ title }}", page)
		pageHtml = strings.ReplaceAll(pageHtml, "{{{ "+componentName+" }}}", component)
		i++
	}

	pageHtml = strings.ReplaceAll(pageHtml, "{{ url }}", os.Getenv("URL"))
	pageHtml = strings.ReplaceAll(pageHtml, "{{ api }}", os.Getenv("API"))

	return pageHtml
}

func stringInList(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}

// SERVER SIDE
var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	clients         = make(map[*websocket.Conn]string)
	SERVER_PASSWORD = ""
)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("WebSocket upgrade error: %s\n", err)
		return
	}

	clientIP := r.RemoteAddr
	fmt.Printf("Client %s connected\n", clientIP)

	if clients[conn] == "" {
		if SERVER_PASSWORD != "" {
			sendResponse(conn, "PACKET.AUTH_REQUESTED")
		} else {
			clients[conn] = clientIP
			sendResponse(conn, "PACKET.AUTHENTICATED")
		}
	}

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			delete(clients, conn)
			break
		}

		if messageType == websocket.TextMessage {
			message := string(p)
			args := strings.Split(message, " ")
			fmt.Printf("Received message from %s: %s\n", clientIP, message)

			PACKET := args[0]
			args = args[1:]

			// Handle server authentication if enabled
			if clients[conn] == "" {
				if SERVER_PASSWORD != "" {
					if PACKET == "PACKET.AUTH" {
						if args[0] == SERVER_PASSWORD {
							fmt.Printf("Authenticated new client using password %s\n", clientIP)
							sendResponse(conn, "PACKET.AUTHENTICATED")
							clients[conn] = clientIP
						} else {
							fmt.Printf("Closed unauthenticated connection (invalid password) %s\n", clientIP)
							sendResponse(conn, "PACKET.UNAUTHENTICATED")
							conn.Close()
						}
					} else {
						fmt.Printf("Closed unauthenticated connection (invalid first packet) %s\n", clientIP)
						sendResponse(conn, "PACKET.UNAUTHENTICATED")
						conn.Close()
					}
				} else {
					fmt.Printf("Authenticated new client %s\n", clientIP)
					clients[conn] = clientIP
					sendResponse(conn, "PACKET.AUTHENTICATED")
				}
			}

			// handle commands
			if PACKET == "PACKET.RUN_RCON_COMMAND" {
				if args[0] != "" {
					RCON_SERVER_ADRESS := args[0]
					RCON_SERVER_PORT := args[1]
					RCON_SERVER_PASSWORD := args[2]
					if RCON_SERVER_ADRESS == "" || RCON_SERVER_PORT == "" || RCON_SERVER_PASSWORD == "" {
						sendResponse(conn, "PACKET.ERROR missing required rcon server connection information")
						return
					}
					fmt.Println("Command run packet found! " + strings.Join(args[3:], " "))

					rconClient, err := rcon.Dial(RCON_SERVER_ADRESS+":"+RCON_SERVER_PORT, RCON_SERVER_PASSWORD)
					if err != nil {
						log.Println("RCON connection error:", err)
						sendResponse(conn, "PACKET.RCON_ERROR_RESPONSE "+err.Error())
						return
					}
					defer rconClient.Close()

					_, err = rconClient.Write(strings.Join(args[3:], " "))
					response, _, err := rconClient.Read()

					if err != nil {
						fmt.Println("Error sending RCON command:", err)
						sendResponse(conn, "PACKET.RCON_ERROR_RESPONSE "+err.Error())
						return
					}
					rconClient.Close()
					sendResponse(conn, "PACKET.RCON_SUCCESS_RESPONSE "+strings.Join(args[3:], ".")+" "+response)
				} else {
					fmt.Println("Command run packet found, but missing command args!")
				}
			}

		}
	}
}

func sendResponse(conn *websocket.Conn, message string) {
	err := conn.WriteMessage(websocket.TextMessage, []byte(message))
	if err != nil {
		fmt.Printf("WebSocket write error: %s\n", err)
		delete(clients, conn)
	}
}
