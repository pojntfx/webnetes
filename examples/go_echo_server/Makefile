all: native-go native-tinygo wasm-go wasm-tinygo

native-go:
	@docker run -v ${PWD}:/src:z golang sh -c 'cd /src && go build -o out/go/echo_server main.go'

native-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -o out/tinygo/echo_server main.go'

wasm-go:
	@docker run -v ${PWD}:/src:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /src && go build -o out/go/echo_server.wasm main.go'

wasm-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/echo_server_original.wasm main.go'
	@docker run -v ${PWD}:/src:z pojntfx/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O out/tinygo/echo_server_original.wasm -o out/tinygo/echo_server.wasm'
	@rm out/tinygo/echo_server_original.wasm

clean:
	@rm -rf out

seed-go: wasm-go
	@docker run -it -v ${PWD}/out:/out --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/go/*.wasm"

seed-tinygo: wasm-tinygo
	@docker run -it -v ${PWD}/out:/out --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/tinygo/*.wasm"