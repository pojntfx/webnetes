package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/alphahorizonio/tinynet/pkg/tinynet"
	"github.com/google/uuid"
	"github.com/ugjka/messenger"
)

func main() {
	// Parse flags
	laddr := flag.String("laddr", "127.0.0.1:4206", "Address to listen on")
	flag.Parse()

	// Listen
	lis, err := tinynet.Listen("tcp", *laddr)
	if err != nil {
		log.Fatal("could not listen", err)
	}

	log.Println("Listening on", *laddr)

	// Receive & broadcast
	msgr := messenger.New(0, true)
	for {
		// Accept
		conn, err := lis.Accept()
		if err != nil {
			log.Fatal("could not accept", err)
		}

		// Notify peers of new node
		log.Println("Client connected")
		clientID := uuid.New()
		msgr.Broadcast(fmt.Sprintf("<system>:\tClient %v joined\n", clientID.String()))

		// Receive from clients & send to bus
		go func(innerConn tinynet.Conn) {
			for {
				// Receive
				buf := make([]byte, 1024)
				if n, err := innerConn.Read(buf); err != nil {
					if n == 0 {
						break
					}

					log.Println("could not read from connection, removing connection", err)

					break
				}

				// Send to bus
				msgr.Broadcast(fmt.Sprintf("<%v>:\t%v", clientID.String(), string(buf)))
			}

			// Close client socket
			log.Println("Client disconnected")

			_ = innerConn.Close() // We keep closing to the OS
		}(conn)

		// Receive from bus & broadcast to clients
		go func(innerConn tinynet.Conn) {
			// Subscribe to new messages
			bus, err := msgr.Sub()
			if err != nil {
				log.Println("could not subscribe to broadcasted messages", err)
			}
			defer msgr.Unsub(bus)

			for msg := range bus {
				// Send to client
				if n, err := innerConn.Write([]byte(fmt.Sprintf("%v", msg))); err != nil {
					if n == 0 {
						break
					}

					fmt.Println("could not write to connection, removing connection", err)

					break
				}
			}

			// Close client socket
			log.Println("Client disconnected")

			_ = innerConn.Close() // We keep closing to the OS
		}(conn)
	}
}
