TARGETS=c_echo_client c_echo_server cpp_echo_client cpp_echo_server go_echo_client go_echo_server java_hello_world zig_hello_world assemblyscript_hello_world

all: $(TARGETS)

$(TARGETS):
	@cd examples/$@ && $(MAKE)

clean:
	@rm -rf ./examples/*/{out,build,.go,target,.m2,node_modules}