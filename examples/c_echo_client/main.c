#include "berkeley_sockets.h"
#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define RECONNECT_TIMEOUT 2

#define SENT_MESSAGE_BUFFER_LENGTH 1024
#define RECEIVED_MESSAGE_PREFIX "You've sent: "
#define RECEIVED_MESSAGE_BUFFER_LENGTH                                         \
  SENT_MESSAGE_BUFFER_LENGTH + sizeof(RECEIVED_MESSAGE_PREFIX)

int main(int argc, char *argv[]) {
  // Flags parsing
  char *connect_host = "127.0.0.1";
  int connect_port = 1234;

  int opt;
  while ((opt = getopt(argc, argv, "c:p:")) != -1) {
    switch (opt) {
    case 'c':
      connect_host = optarg;

      optind--;

      break;

    case 'p':
      connect_port = atoi(optarg);

      break;

    default:
      fprintf(stderr, "Usage: %s -c HOST -p PORT\n", argv[0]);

      exit(EXIT_FAILURE);
    }
  }

  // Variables
  int server_sock;
  struct sockaddr_in server_host;

  ssize_t sent_message_length;
  char read_message[SENT_MESSAGE_BUFFER_LENGTH];
  size_t received_message_length;
  char received_message[RECEIVED_MESSAGE_BUFFER_LENGTH];

  socklen_t server_host_length = sizeof(struct sockaddr_in);

  memset(&server_host, 0, sizeof(server_host));

  // Logging
  char server_address_readable[sizeof(connect_host) + sizeof(connect_port) + 1];
  sprintf(server_address_readable, "%s:%d", connect_host, connect_port);

  // Create address
  server_host.sin_family = AF_INET;
  server_host.sin_port = htons(connect_port);
  if (inet_pton(AF_INET, connect_host, &server_host.sin_addr) == -1) {
    perror("[ERROR] Could not parse IP address:");

    exit(EXIT_FAILURE);
  }

  // Create socket
  if ((server_sock = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    perror("[ERROR] Could not create socket:");

    printf("[ERROR] Could not create socket %s\n", server_address_readable);

    exit(EXIT_FAILURE);
  }

  // Connect loop
  while (1) {
    printf("[INFO] Connecting to server %s\n", server_address_readable);

    // Connect
    if ((connect(server_sock, (struct sockaddr *)&server_host,
                 server_host_length)) == -1) {
      perror("[ERROR] Could not connect to server:");

      printf("[ERROR] Could not connect to server %s, retrying in %ds\n",
             server_address_readable, RECONNECT_TIMEOUT);

      sleep(RECONNECT_TIMEOUT);

      continue;
    }

    printf("[INFO] Connected to server %s\n", server_address_readable);

    // Read loop
    while (1) {
      memset(&received_message, 0, RECEIVED_MESSAGE_BUFFER_LENGTH);
      memset(&read_message, 0, SENT_MESSAGE_BUFFER_LENGTH);

      printf("[DEBUG] Waiting for user input\n");

      // Read
      fgets(read_message, SENT_MESSAGE_BUFFER_LENGTH, stdin);

      // Send
      sent_message_length =
          send(server_sock, read_message, strlen(read_message), 0);
      if (sent_message_length == -1) {
        perror("[ERROR] Could not send to server:");

        printf("[ERROR] Could not send to server %s, dropping message\n",
               server_address_readable);

        break;
      }

      printf("[DEBUG] Sent %zd bytes to %s\n", sent_message_length,
             server_address_readable);

      printf("[DEBUG] Waiting for server %s to send\n",
             server_address_readable);

      // Receive
      received_message_length = recv(server_sock, &received_message,
                                     RECEIVED_MESSAGE_BUFFER_LENGTH, 0);
      if (received_message_length == -1) {
        perror("[ERROR] Could not receive from server:");

        printf("[ERROR] Could not receive from server %s, dropping message\n",
               server_address_readable);

        break;
      }

      if (received_message_length == 0) {
        break;
      }

      printf("[DEBUG] Received %zd bytes from %s\n", received_message_length,
             server_address_readable);

      // Print
      printf("%s", received_message);
    }

    printf("[INFO] Disconnected from server %s\n", server_address_readable);

    // Shutdown
    if ((shutdown(server_sock, SHUT_RDWR)) == -1) {
      perror("[ERROR] Could not shutdown socket:");

      printf("[ERROR] Could not shutdown socket %s, stopping\n",
             server_address_readable);

      break;
    };
  }

  return 0;
}