all: native wasm

native:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.cargo:/usr/local/cargo/registry:z alphahorizonio/rust-sdk sh -c 'cd /src && cargo build --release'

wasm:
	@docker run -v ${PWD}:/src:z -v ${PWD}/.cargo:/usr/local/cargo/registry:z alphahorizonio/rust-sdk sh -c 'cd /src && cargo build --release --target wasm32-wasi'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O target/wasm32-wasi/release/rust_hello_world.wasm -o target/wasm32-wasi/release/rust_hello_world.wasm'

clean:
	@rm -rf target

seed: clean wasm
	@docker run -it -v ${PWD}/target:/target --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /target/wasm32-wasi/release/*.wasm"