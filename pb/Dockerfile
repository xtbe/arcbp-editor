FROM alpine:3.21

ARG PB_VERSION=0.36.4

RUN apk add --no-cache ca-certificates unzip wget

# Download and unzip the PocketBase binary (auto-detect arch)
RUN ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') && \
    wget -q \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" \
    -O /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb \
  && rm /tmp/pb.zip \
  && chmod +x /pb/pocketbase

# Work from /pb so PocketBase finds pb_migrations/ and pb_data/ automatically
WORKDIR /pb

# Copy migrations — run automatically on first start, skipped on subsequent starts
COPY pb_migrations/ /pb/pb_migrations/

VOLUME /pb/pb_data

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
