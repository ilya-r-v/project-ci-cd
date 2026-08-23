# devops-pipeline-demo
 
Простое REST API для заметок — пет-проект для отработки CI/CD пайплайна.
 
## Эндпоинты
 
- `GET /` — приветствие
- `GET /health` — healthcheck
- `GET /api/info` — версия и статистика приложения
- `GET /api/notes` — список заметок
- `GET /api/notes/:id` — одна заметка
- `POST /api/notes` — создать заметку (`{title, content}`)
- `PUT /api/notes/:id` — обновить заметку
- `DELETE /api/notes/:id` — удалить заметку
## Запуск локально
 
```bash
npm install
npm start
```
 
## Запуск в Docker
 
```bash
docker build -t devops-pipeline-demo .
docker run -p 3000:3000 devops-pipeline-demo
```
 
## Проверка
 
```bash
curl localhost:3000/health
curl -X POST localhost:3000/api/notes -H "Content-Type: application/json" -d '{"title":"Test"}'
curl localhost:3000/api/notes
```