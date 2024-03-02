package main

import (
	"log"
	"net/http"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"

	"middleware_loader/core/services/graphql_service"
	"middleware_loader/infrastructure/graph"
	"middleware_loader/kernel/bootstrap"
	"middleware_loader/kernel/configs"
	"middleware_loader/ui/routers"
)

func main() {
	config := configs.Config{}
	cfg, _ := config.LoadEnv()
	clientUrl := cfg.ClientCORSAllowedUrl
	router := chi.NewRouter()

	router.Use(middleware.Logger)
	router.Use(middleware.RequestID)
	router.Use(middleware.Recoverer)
	router.Use(middleware.RedirectSlashes)
	router.Use(middleware.Timeout(time.Second * 60))

	// router.Use(func(next http.Handler) http.Handler {
	// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 		if r.RequestURI == "/graphql" {
	// 			w.WriteHeader(http.StatusForbidden)
	// 			return
	// 		}
	// 		next.ServeHTTP(w, r)
	// 	})
	// })

	corsHandler := cors.New(
		cors.Options{
			AllowedOrigins: []string{clientUrl},
			AllowedMethods: []string{
				http.MethodHead,
				http.MethodGet,
				http.MethodPost,
				http.MethodPut,
				http.MethodPatch,
				http.MethodDelete,
			},
			AllowedHeaders:   []string{"*"},
			AllowCredentials: true,
		})

	router.Use(corsHandler.Handler)

	// DATABASE
	app := bootstrap.App()
	databaseEnv := app.Env
	db := app.Mongo.Database(databaseEnv.DBName)
	log.Println("Connected to MongoDB")
	defer func() {
		log.Println("Closing MongoDB connection")
		app.CloseDBConnection()
		log.Println("MongoDB connection closed")
	}()

	// SERVICES
	authService := services.NewAuthService()
	gaiaService := services.NewGaiaService()
	taskService := services.NewTaskService()
	projectService := services.NewProjectService()

	// ROUTERS
	routers.NewMicroserviceRouter(db, router)
	routers.NewURLPermissionRouter(db, router)
	
	routers.NewAuthRouter(authService, router)
	routers.NewGaiaRouter(gaiaService, router)
	routers.NewTaskRouter(taskService, router)
	routers.NewProjectRouter(projectService, router)

	// GRAPHQL
	router.Handle("/graphql", playground.Handler("GraphQL playground", "/query"))
	router.Handle("/query", handler.NewDefaultServer(
		graph.NewExecutableSchema(
			graph.Config{
				Resolvers: &graph.Resolver{
					AuthGraphQLService:    authService,
					TaskGraphQLService:    taskService,
					ProjectGraphQLService: projectService,
				},
			},
		),
	))

	log.Printf("connect to http://localhost:%s/ for GraphQL playground", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, router))
}
