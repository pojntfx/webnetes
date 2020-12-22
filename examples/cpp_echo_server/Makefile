all: native wasm

native:
	@docker run -v ${PWD}:/src:z silkeh/clang sh -c 'cd /src && mkdir -p build/native && cd build/native && cmake ../.. && make'

wasm:
	@docker run -v ${PWD}:/src:z pojntfx/wasi-sdk sh -c 'cd /src && mkdir -p build/wasm && cd build/wasm && cmake -DWASI=true ../.. && make'

clean:
	@rm -rf build

seed: wasm
	@docker run -it -v ${PWD}/build:/build --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /build/wasm/*.wasm"