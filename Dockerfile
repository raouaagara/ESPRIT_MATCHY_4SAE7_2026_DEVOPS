FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/frontoffice /usr/share/nginx/html
EXPOSE 80