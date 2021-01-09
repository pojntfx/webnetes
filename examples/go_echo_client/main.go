package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"

	"github.com/alphahorizonio/tinynet/pkg/tinynet"
)

func main() {
	raddr := flag.String("raddr", "127.0.0.1:1234", "Address to connect to")
	flag.Parse()

	conn, err := tinynet.Dial("tcp", *raddr)
	if err != nil {
		fmt.Println("could not dial", err)

		os.Exit(1)
	}

	fmt.Println("Connected to", *raddr)

	reader := bufio.NewReader(os.Stdin)

	for {
		out, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("could not read from stdin", err)

			os.Exit(1)
		}

		if n, err := conn.Write([]byte(out)); err != nil {
			if n == 0 {
				break
			}

			fmt.Println("could not write from connection, removing connection", err)

			break
		}

		buf := make([]byte, 1038)
		if n, err := conn.Read(buf); err != nil {
			if n == 0 {
				break
			}

			fmt.Println("could not read from connection, removing connection", err)

			break
		}

		fmt.Printf("%v", string(buf))
	}

	fmt.Println("Disconnected")

	if err := conn.Close(); err != nil {
		fmt.Println("could not close connection", err)
	}
}
