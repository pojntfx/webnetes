all:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.m2:/root/.m2:z maven sh -c 'cd /src && mvn clean install'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O target/javascript/classes.wasm -o target/javascript/classes.wasm'

clean:
	@rm -rf target

seed: all
	@docker run -it -v ${PWD}/target:/target:z --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /target/javascript/classes.wasm"