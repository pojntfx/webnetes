extern "C" {
#include "berkeley_sockets.h"
}
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

const int BUFLEN_IN = 1024;
const int BUFLEN_OUT = 1038;

int main(int argc, char *argv[]) {
  // Flags
  std::string listen_host = "127.0.0.1";
  int listen_port = 1234;

  int opt;
  while ((opt = getopt(argc, argv, "l:p:")) != -1) {
    switch (opt) {
    case 'l':
      listen_host = optarg;

      optind--;

      break;

    case 'p':
      listen_port = std::stoi(optarg);

      break;

    default:
      std::cout << "Usage: " << argv[0] << " -l HOST -p PORT" << std::endl;

      return EXIT_FAILURE;
    }
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
    for (;;) {
      std::cout << "[DEBUG] Waiting for client " << client_address_readable
                << " to send" << std::endl;

      // Receive
      int received_message_length = 1;
      char received_message[BUFLEN_IN] = "";
      if ((received_message_length =
               recv(client_socket, &received_message, BUFLEN_IN, 0)) == -1) {
        std::cout << "[ERROR] Could not receive from client "
                  << client_address_readable
                  << ", dropping message: " << strerror(errno) << std::endl;
      } else if (received_message_length == 0) {
        break;
      }

      std::cout << "[DEBUG] Received " << received_message_length
                << " bytes from " << client_address_readable << std::endl;

      // Process
      char sent_message[BUFLEN_OUT] = "";
      sprintf((char *)(&sent_message), "You've sent: %s", received_message);
      sent_message[BUFLEN_OUT - 1] = '\0';

      // Send
      int sent_message_length = 0;
      if ((sent_message_length =
               send(client_socket, sent_message, BUFLEN_OUT, 0)) == -1) {
        std::cout << "[ERROR] Could not send to client "
                  << client_address_readable
                  << ", dropping message: " << strerror(errno) << std::endl;
      }

      std::cout << "[DEBUG] Sent " << sent_message_length << " bytes to "
                << client_address_readable << std::endl;
    }

    // Shutdown
    if ((shutdown(client_socket, SHUT_RDWR)) == -1) {
      std::cout << "[ERROR] Could not shutdown socket: " << strerror(errno)
                << std::endl;

      return EXIT_FAILURE;
    }
  }

  return EXIT_SUCCESS;
}