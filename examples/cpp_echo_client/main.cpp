extern "C" {
#include "unisockets.h"
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

const int BUFLEN_OUT = 1024;
const int BUFLEN_IN = 1038;
const int RECONNECT_TIMEOUT = 2;

int main(int argc, char *argv[]) {
  // Flags
  std::string connect_host = "127.0.0.1";
  int connect_port = 1234;

  int opt;
  while ((opt = getopt(argc, argv, "c:p:")) != -1) {
    switch (opt) {
    case 'c':
      connect_host = optarg;

      optind--;

      break;

    case 'p':
      connect_port = std::stoi(optarg);

      break;

    default:
      std::cout << "Usage: " << argv[0] << " -c HOST -p PORT" << std::endl;

      return EXIT_FAILURE;
    }
  }

  // Address
  sockaddr_in server_address;
  server_address.sin_family = AF_INET;
  server_address.sin_port = htons(connect_port);
  if (inet_pton(AF_INET, connect_host.c_str(), &server_address.sin_addr) ==
      -1) {
    std::cout << "[ERROR] Could not parse IP address: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }
  std::string server_address_readable =
      connect_host + ":" + std::to_string(connect_port);

  // Socket
  int server_socket;
  if ((server_socket = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    std::cout << "[ERROR] Could not create socket: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }

  // Connect loop
  for (;;) {
    std::cout << "[INFO] Connecting to server " << server_address_readable
              << std::endl;

    // Connect
    int server_address_length;
    if ((connect(server_socket, reinterpret_cast<sockaddr *>(&server_address),
                 server_address_length = sizeof(server_address))) == -1) {
      std::cout << "[ERROR] Could not connect to server "
                << server_address_readable << ", retrying in "
                << RECONNECT_TIMEOUT << "s: " << strerror(errno) << std::endl;

      sleep(RECONNECT_TIMEOUT);

      continue;
    }

    std::cout << "[INFO] Connected to server " << server_address_readable
              << std::endl;

    // Read loop
    for (;;) {
      std::cout << "[DEBUG] Waiting for user input" << std::endl;

      // Read
      std::string read_message;
      std::getline(std::cin, read_message);
      read_message += "\n";

      // Send
      int sent_message_length = 0;
      if ((sent_message_length = send(server_socket, read_message.c_str(),
                                      BUFLEN_OUT, 0)) == -1) {
        std::cout << "[ERROR] Could not send to server "
                  << server_address_readable
                  << ", dropping message: " << strerror(errno) << std::endl;
      }

      std::cout << "[DEBUG] Sent " << sent_message_length << " bytes to "
                << server_address_readable << std::endl;

      std::cout << "[DEBUG] Waiting for server " << server_address_readable
                << " to send" << std::endl;

      // Receive
      int received_message_length = 1;
      char received_message[BUFLEN_IN] = "";
      if ((received_message_length =
               recv(server_socket, &received_message, BUFLEN_IN, 0)) == -1) {
        std::cout << "[ERROR] Could not receive from service "
                  << server_address_readable
                  << ", dropping message: " << strerror(errno) << std::endl;
      } else if (received_message_length == 0) {
        break;
      }

      std::cout << "[DEBUG] Received " << received_message_length
                << " bytes from " << server_address_readable << std::endl;

      // Print
      std::cout << received_message;
    }
  }

  std::cout << "[INFO] Disconnected from server " << server_address_readable
            << std::endl;

  // Shutdown
  if ((shutdown(server_socket, SHUT_RDWR)) == -1) {
    std::cout << "[ERROR] Could not shutdown socket: " << strerror(errno)
              << std::endl;

    return EXIT_FAILURE;
  }

  return EXIT_SUCCESS;
}