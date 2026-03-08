#!/bin/bash

# 启动后端服务
echo "启动后端服务..."
cd backend && npm run dev &

# 等待2秒
sleep 2

# 启动前端服务
echo "启动前端服务..."
cd ../frontend && npm run dev &

echo "服务启动完成！"
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3001"

wait