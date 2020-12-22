cmake_minimum_required(VERSION 3.13.4)

# WASI Config
if(WASI)
	set(WASI_SDK_PREFIX "/opt/wasi-sdk-12.0")
	set(CMAKE_SYSROOT "${WASI_SDK_PREFIX}/share/wasi-sysroot")
	set(CMAKE_TOOLCHAIN_FILE "${WASI_SDK_PREFIX}/share/cmake/wasi-sdk.cmake")
endif()

# Project
project(echo_client)
add_executable(echo_client "main.cpp")

# WASI Config
if(WASI)
	set(CMAKE_CXX_FLAGS "-DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS")
	set(CMAKE_EXE_LINKER_FLAGS "-Wl,--allow-undefined")
	set(CMAKE_EXECUTABLE_SUFFIX ".wasm")

	add_custom_command(TARGET echo_client
		POST_BUILD
		COMMAND sh -c "wasm-opt --asyncify -O $<TARGET_FILE:echo_client> -o $<TARGET_FILE:echo_client>"
		VERBATIM
	)
endif()