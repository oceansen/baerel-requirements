FROM node:22-alpine
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
ENV NODE_ENV=production PORT=8080 DB_PATH=/data/baerel.sqlite
EXPOSE 8080
# Runs as root: Render mounts the persistent disk at /data root-owned.
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
