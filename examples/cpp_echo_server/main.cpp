#include <cstdint>
#include <iostream>
#include <string>
#include <unistd.h>

int main(int argc, char *argv[]) {
  // Flags
  std::string listen_host = "127.0.0.1";
  int listen_port = 1234;

  int opt;
  while ((opt = getopt(argc, argv, "l:p:") != -1)) {
    switch (opt) {
    case 'l': {
      listen_host = optarg;

      break;
    }

    case 'p': {
      listen_port = std::stoi(optarg);

      break;
    }

    default: {
      std::cout << "Usage: " << argv[0] << " [-lp]\n";

      std::exit(EXIT_FAILURE);
    }
    }
  }
}