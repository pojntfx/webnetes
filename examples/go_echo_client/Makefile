all: native wasm

native:
	@docker run -v ${PWD}:/src:z golang sh -c 'cd /src && go build -o out/echo_client main.go'

wasm:
	@docker run -v ${PWD}:/src:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /src && go build -o out/echo_client.wasm main.go'

clean:
	@rm -rf out

seed: all
	@docker run -it -v ${PWD}/out:/out --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/*.wasm"