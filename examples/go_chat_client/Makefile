all: native wasm 

native:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.go:/go:z golang sh -c 'cd /src && go build -o out/go/chat_client main.go'

wasm:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.go:/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /src && go build -o out/go/chat_client.wasm main.go'

clean:
	@rm -rf out

seed: wasm
	@docker run -it -v ${PWD}/out:/out:z --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/go/*.wasm"