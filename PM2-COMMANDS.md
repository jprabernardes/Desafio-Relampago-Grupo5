# Guia de Comandos PM2 - Gym System API

## Comandos Básicos

### Gerenciamento da Aplicação
```bash
# Iniciar a aplicação
pm2 start ecosystem.config.js

# Parar a aplicação
pm2 stop gym-system-api

# Reiniciar a aplicação
pm2 restart gym-system-api

# Recarregar a aplicação (zero-downtime)
pm2 reload gym-system-api

# Deletar a aplicação do PM2
pm2 delete gym-system-api
```

### Monitoramento
```bash
# Listar todas as aplicações
pm2 list

# Monitorar em tempo real
pm2 monit

# Informações detalhadas
pm2 info gym-system-api

# Mostrar logs em tempo real
pm2 logs gym-system-api

# Mostrar apenas logs de erro
pm2 logs gym-system-api --err

# Limpar logs
pm2 flush
```

### Atualização do Código
```bash
# 1. Build do código TypeScript
npm run build

# 2. Reiniciar a aplicação
pm2 restart gym-system-api

# Ou fazer tudo de uma vez:
npm run build && pm2 restart gym-system-api
```

## Configuração Atual

### Recursos Configurados
- **Auto-restart**: Sim
- **Max Memory**: 500MB (reinicia se ultrapassar)
- **Max Restarts**: 10 tentativas
- **Restart Delay**: 4 segundos com backoff exponencial
- **Min Uptime**: 10 segundos (considera instável se cair antes)
- **Logs**: `~/.pm2/logs/gym-system-api-*.log`

### Inicialização Automática no Boot
Para configurar a aplicação para iniciar automaticamente quando o servidor reiniciar:

```bash
# Execute este comando (precisa de sudo):
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u desafio10 --hp /home/desafio10

# Depois salve a lista de processos:
pm2 save
```

## Comandos Avançados

### Performance
```bash
# Mostrar métricas de performance
pm2 show gym-system-api

# Resetar contador de restarts
pm2 reset gym-system-api
```

### Logs
```bash
# Ver últimas 200 linhas dos logs
pm2 logs gym-system-api --lines 200

# Ver logs com timestamp
pm2 logs gym-system-api --timestamp

# Salvar logs em arquivo
pm2 logs gym-system-api --out /path/to/file.log
```

### Gerenciamento de Memória
```bash
# Ver uso de memória
pm2 list

# Forçar garbage collection (se necessário)
pm2 trigger gym-system-api gc
```

## Troubleshooting

### A aplicação está reiniciando muito
```bash
# Ver logs de erro
pm2 logs gym-system-api --err --lines 100

# Ver informações detalhadas
pm2 info gym-system-api

# Verificar se há erro no código
pm2 logs gym-system-api
```

### Verificar saúde da aplicação
```bash
# Status geral
pm2 list

# Detalhes completos
pm2 show gym-system-api

# Teste manual da API
curl http://localhost:3000/api/health
```

### Logs crescendo muito
```bash
# Rotacionar logs (instalar módulo primeiro)
pm2 install pm2-logrotate

# Configurar rotação
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Integração com Nginx
A aplicação está configurada para rodar na porta 3000, e o Nginx faz proxy reverso para:
- `/server10/api/` → `http://localhost:3000/api/`
- `/api/` → `http://localhost:3000/api/`

## Backup e Restore
```bash
# Salvar configuração atual
pm2 save

# Restaurar configuração salva
pm2 resurrect

# Ver configuração salva
cat ~/.pm2/dump.pm2
```
