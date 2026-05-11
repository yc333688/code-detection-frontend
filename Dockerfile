FROM registry.cn-hangzhou.aliyuncs.com/acs-sample/nginx:latest

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
