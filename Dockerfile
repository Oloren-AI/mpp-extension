FROM node:19

WORKDIR /usr/app

RUN npm i -g pnpm

COPY package.json ./
COPY pnpm-lock.json ./
COPY pnpm-workspace.yaml ./
COPY core/backend/package.json ./core/backend/package.json
COPY core/frontend/package.json ./core/frontend/package.json

RUN pnpm i

COPY . .

RUN pnpm turbo dev

EXPOSE 80

CMD ["bash", "start.sh"]