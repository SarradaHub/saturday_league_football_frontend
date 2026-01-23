FROM node:20-alpine AS build
WORKDIR /app

COPY platform ./platform
COPY saturday_league_football_frontend ./saturday_league_football_frontend

WORKDIR /app/saturday_league_football_frontend
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/saturday_league_football_frontend/dist /usr/share/nginx/html
EXPOSE 80
