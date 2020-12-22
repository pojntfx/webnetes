#include <arpa/inet.h>
#include <cstdint>
#include <iostream>
#include <iterator>
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
  std::string server_address_readable =
      listen_host + ":" + std::to_string(listen_port);

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

  std::cout << "[INFO] Listening on " << server_address_readable << std::endl;

  // Accept loop
  for (;;) {
    std::cout << "[DEBUG] Accepting on " << server_address_readable
              << std::endl;

    // Accept
    int client_socket;
    sockaddr_in client_address;
    socklen_t client_address_length;

    if ((client_socket = accept(
             server_socket, reinterpret_cast<sockaddr *>(&client_address),
             &(client_address_length = sizeof(client_address)))) == -1) {
      std::cout << "[ERROR] Could not accept, continuing: " << strerror(errno)
                << std::endl;
    }

    char client_host[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &client_address.sin_addr, client_host,
              sizeof(client_host));
    std::string client_address_readable =
        std::string(client_host) + ":" +
        std::to_string(client_address.sin_port);

    std::cout << "[INFO] Accepted client " << client_address_readable
              << std::endl;

    // Receive loop
    int received_message_length = 1;
    for (;;) {
      char received_message[1024];
      char sent_message[1038];

      std::cout << "[DEBUG] Waiting for client " << client_address_readable
                << " to send" << std::endl;

      // Receive
      if ((received_message_length = recv(client_socket, &received_message,
                                          sizeof(received_message), 0)) == -1) {
        std::cout << "[ERROR] Could not receive from client " << strerror(errno)
                  << ", dropping message" << std::endl;
      } else if (received_message_length == 0) {
        break;
      }

      std::cout << "[DEBUG] Received " << received_message_length
                << " bytes from " << client_address_readable << std::endl;
    }
  }
}