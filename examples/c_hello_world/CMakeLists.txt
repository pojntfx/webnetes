cmake_minimum_required(VERSION 3.13.4)

# WASI Config
if(WASI)
	set(WASI_SDK_PREFIX "/opt/wasi-sdk-12.0")
	set(CMAKE_SYSROOT "${WASI_SDK_PREFIX}/share/wasi-sysroot")
	set(CMAKE_TOOLCHAIN_FILE "${WASI_SDK_PREFIX}/share/cmake/wasi-sdk.cmake")
endif()

# Project
project(hello_world)
add_executable(hello_world "main.c")

# WASI Config
if(WASI)
	set(CMAKE_EXE_LINKER_FLAGS "-Wl,--allow-undefined")
	set(CMAKE_EXECUTABLE_SUFFIX ".wasm")

	add_custom_command(TARGET hello_world
		POST_BUILD
		COMMAND sh -c "wasm-opt --asyncify -O $<TARGET_FILE:hello_world> -o $<TARGET_FILE:hello_world>"
		VERBATIM
	)
endif()