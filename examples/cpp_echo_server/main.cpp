#include <arpa/inet.h>
#include <cstdint>
#include <iostream>
#include <netinet/in.h>
#include <stdexcept>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <sys/socket.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
  // Flags
  std::string listen_host = "127.0.0.1";
  int listen_port = 1234;

  for (;;) {
    switch (getopt(argc, argv, "l:p:")) {
    case 'l': {
      listen_host = optarg;

      break;
    }

    case 'p': {
      listen_port = std::stoi(optarg);

      break;
    }

    default: {
      std::cout << "Usage: " << argv[0] << " [-lp]" << std::endl;

      return EXIT_FAILURE;
    }
    }

    break;
  }

  // Address
  sockaddr_in server_address;
  server_address.sin_family = AF_INET;
  server_address.sin_port = htons(listen_port);
  if (inet_pton(AF_INET, listen_host.c_str(), &server_address.sin_addr) == -1) {
    std::cout << "[ERROR] Could not parse IP address: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }

  // Socket
  int server_socket;
  if ((server_socket = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    std::cout << "[ERROR] Could not create socket: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }

  // Bind
  if ((bind(server_socket, reinterpret_cast<sockaddr *>(&server_address),
            sizeof(server_address))) == -1) {
    std::cout << "[ERROR] Could not bind to socket: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }

  // Listen
  if ((listen(server_socket, 5)) == -1) {
    std::cout << "[ERROR] Could not listen on socket: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }

  std::cout << "[INFO] Listening on " << listen_host << ":" << listen_port
            << std::endl;
}