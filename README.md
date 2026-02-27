# 坦克大战（浏览器版）

这是一个纯前端实现的坦克大战小游戏，支持键盘操作与本地部署。

## 功能

- 玩家坦克移动（W/A/S/D）
- 玩家开火（J）
- 敌方坦克自动巡航与射击
- 障碍物碰撞检测
- 得分、生命值与剩余敌军 HUD
- 胜利 / 失败判定与重开

## 本地运行

### 方式 1：直接启动静态服务器

```bash
python3 -m http.server 8000
```

浏览器打开：`http://localhost:8000`

### 方式 2：Docker 部署

```bash
docker build -t tank-game:latest .
docker run --rm -p 8080:80 tank-game:latest
```

浏览器打开：`http://localhost:8080`

## 操作说明

- `W/A/S/D`：移动
- `J`：发射子弹
- 点击“重新开始”：重置游戏
