all: native-go native-tinygo wasm-go wasm-tinygo

native-go:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.go:/go:z golang sh -c 'cd /src && go build -o out/go/hello_world main.go'

native-tinygo:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.go:/root/go:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -o out/tinygo/hello_world main.go'

wasm-go:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.go:/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /src && go build -o out/go/hello_world.wasm main.go'

wasm-tinygo:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.go:/root/go:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -target wasi -o out/tinygo/hello_world.wasm main.go'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O out/tinygo/hello_world.wasm -o out/tinygo/hello_world.wasm'

clean:
	@rm -rf out

seed-go: wasm-go
	@docker run -it -v ${PWD}/out:/out:z --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/go/*.wasm"

seed-tinygo: wasm-tinygo
	@docker run -it -v ${PWD}/out:/out:z --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/tinygo/*.wasm"