@echo off

rem 启动后端服务
echo 启动后端服务...
start "后端服务" cmd /c "cd backend && npm run dev"

rem 等待2秒
ping 127.0.0.1 -n 3 > nul

rem 启动前端服务
echo 启动前端服务...
start "前端服务" cmd /c "cd frontend && npm run dev"

echo 服务启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3001

pause