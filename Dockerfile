FROM denoland/deno:ubuntu

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -q update && \
    apt-get -q install -y \
    binutils \
    git \
    gnupg2 \
    libc6-dev \
    libcurl4 \
    libedit2 \
    libgcc-9-dev \
    libpython2.7 \
    libsqlite3-0 \
    libstdc++-9-dev \
    libxml2 \
    libz3-dev \
    pkg-config \
    tzdata \
    uuid-dev \
    zlib1g-dev \
    libtinfo5 \
    curl \
    clang \
    libicu-dev \
    && rm -r /var/lib/apt/lists/*

# Everything up to here should cache nicely between Swift versions, assuming dev dependencies change little
ARG SWIFT_PLATFORM=ubuntu15.10
ARG SWIFT_BRANCH=swift-2.2-release
ARG SWIFT_VERSION=swift-2.2-RELEASE

ENV SWIFT_PLATFORM=$SWIFT_PLATFORM \
    SWIFT_BRANCH=$SWIFT_BRANCH \
    SWIFT_VERSION=$SWIFT_VERSION

# Download GPG keys, signature and Swift package, then unpack, cleanup and execute permissions for foundation libs
RUN SWIFT_URL=https://swift.org/builds/$SWIFT_BRANCH/$(echo "$SWIFT_PLATFORM" | tr -d .)/$SWIFT_VERSION/$SWIFT_VERSION-$SWIFT_PLATFORM.tar.gz \
    && curl -fSsL $SWIFT_URL -o swift.tar.gz \
    && curl -fSsL $SWIFT_URL.sig -o swift.tar.gz.sig \
    && export GNUPGHOME="$(mktemp -d)" \
    && tar -xzf swift.tar.gz --directory / --strip-components=1 \
    && rm -r "$GNUPGHOME" swift.tar.gz.sig swift.tar.gz \
    && chmod -R o+r /usr/lib/swift

# Print Installed Swift Version
RUN swift --version

WORKDIR /app

COPY deps.ts .
RUN deno cache --reload --unstable deps.ts

ADD . .
RUN deno cache --reload --unstable main.ts

EXPOSE 8080
CMD ["run", "--allow-env", "--allow-net", "--allow-run", "main.ts"]
