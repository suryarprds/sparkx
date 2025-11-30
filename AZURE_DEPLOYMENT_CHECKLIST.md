# Azure App Service Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. **Build Verification**
Run these commands locally to ensure everything builds correctly:

```powershell
# Clean previous builds
Remove-Item -Recurse -Force dist, dist-server -ErrorAction SilentlyContinue

# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Build the application
npm run build

# Verify build outputs exist
Test-Path dist\index.html  # Should return True
Test-Path dist-server\index.js  # Should return True
```

### 2. **Database Connection Test**
```powershell
# Test database connectivity (update connection string in .env first)
npx prisma db pull
```

---

## 🔧 Azure Portal Configuration

### **Navigate to: Azure Portal → App Services → sparkx → Configuration**

### Required Application Settings:

| Setting Name | Value | Description |
|-------------|-------|-------------|
| `DATABASE_URL` | `postgresql://sparkxadmin:YOUR_PASSWORD@sparkx.postgres.database.azure.com:5432/postgres?sslmode=require` | Your Azure PostgreSQL connection string |
| `NODE_ENV` | `production` | Sets the app to production mode |
| `CORS_ORIGIN` | `https://sparkx.azurewebsites.net` | Allowed CORS origin |
| `AZURE_APP_URL` | `https://sparkx.azurewebsites.net` | Your Azure App URL |

**Important**: Replace `YOUR_PASSWORD` with your actual database password.

### General Settings:

1. **Stack Settings:**
   - Stack: `Node`
   - Major version: `20 LTS` (or `24 LTS` to match your workflow)
   - Minor version: Latest

2. **Startup Command:**
   ```
   node dist-server/index.js
   ```

3. **Platform Settings:**
   - Platform: `64 Bit`
   - Always On: `On` (recommended for production)
   - ARR Affinity: `Off` (for stateless apps)
   - HTTP version: `2.0`
   - Minimum TLS version: `1.2`

4. **SCM Configuration:**
   - Build automation: `Enabled` (should already be set via `.deployment` file)
   - SCM_DO_BUILD_DURING_DEPLOYMENT: `true` (set automatically)

---

## 🚀 Deployment Methods

### Option 1: GitHub Actions (Recommended - Already Configured)

Your app is already set up with GitHub Actions. Just push to `main`:

```powershell
git add .
git commit -m "Ready for Azure deployment"
git push origin main
```

GitHub Actions will automatically:
1. Build the application
2. Generate Prisma Client
3. Run database migrations
4. Deploy to Azure

### Option 2: Azure CLI Deployment

```powershell
# Login to Azure
az login

# Deploy from local
az webapp up --name sparkx --resource-group <your-resource-group>

# Or deploy specific zip
npm run build
Compress-Archive -Path * -DestinationPath deploy.zip -Force
az webapp deployment source config-zip --resource-group <your-resource-group> --name sparkx --src deploy.zip
```

### Option 3: VS Code Extension

1. Install "Azure App Service" extension
2. Sign in to Azure
3. Right-click on `sparkx` folder
4. Select "Deploy to Web App"

---

## 🔍 Post-Deployment Verification

### 1. Check Application Logs

**Azure Portal:**
```
App Service → sparkx → Monitoring → Log stream
```

**Azure CLI:**
```powershell
az webapp log tail --name sparkx --resource-group <your-resource-group>
```

### 2. Verify Endpoints

Test these URLs (replace with your actual URL):

```powershell
# Health check
curl https://sparkx.azurewebsites.net/api/health

# Frontend
Start-Process https://sparkx.azurewebsites.net
```

### 3. Check Environment Variables

```powershell
az webapp config appsettings list --name sparkx --resource-group <your-resource-group>
```

### 4. Database Migration Status

Check if Prisma migrations ran successfully in Azure logs. Look for:
```
✅ Prisma Client generated
✅ Database connection successful
🚀 Server running on port 8080
```

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Application not starting

**Symptoms:** Azure shows "Application Error"

**Solutions:**
1. Check startup command: `node dist-server/index.js`
2. Verify `dist-server/index.js` exists in deployed package
3. Check Node.js version matches (20 LTS or 24 LTS)
4. Review logs in Log Stream

### Issue 2: Database connection fails

**Symptoms:** 500 errors on API calls

**Solutions:**
1. Verify `DATABASE_URL` is set correctly in Azure Configuration
2. Check Azure PostgreSQL firewall rules allow Azure services
3. Verify connection string includes `?sslmode=require`
4. Test connection: `npx prisma db pull`

### Issue 3: Static files not serving

**Symptoms:** Blank page or 404 for assets

**Solutions:**
1. Verify `dist/` folder exists and contains `index.html`
2. Check `web.config` rewrite rules
3. Ensure `NODE_ENV=production` is set
4. Verify build ran successfully in deployment logs

### Issue 4: CORS errors

**Symptoms:** Browser console shows CORS policy errors

**Solutions:**
1. Set `CORS_ORIGIN=https://sparkx.azurewebsites.net` in Azure config
2. Set `AZURE_APP_URL=https://sparkx.azurewebsites.net` in Azure config
3. Check server logs confirm CORS origins include your domain
4. Clear browser cache and retry

### Issue 5: API routes return 404

**Symptoms:** `/api/*` endpoints don't work

**Solutions:**
1. Check `web.config` DynamicContent rule
2. Verify server is running (check Log Stream)
3. Ensure API routes are defined before catch-all SPA route
4. Check if `dist-server/index.js` is being executed

---

## 📋 Deployment Commands Quick Reference

```powershell
# Local build and test
npm ci
npx prisma generate
npm run build
npm run start  # Test production build locally

# Check what will be deployed
git status
git log -1

# Deploy via Git
git push origin main

# View Azure logs
az webapp log tail --name sparkx --resource-group <your-resource-group>

# Restart app
az webapp restart --name sparkx --resource-group <your-resource-group>

# Open in browser
az webapp browse --name sparkx --resource-group <your-resource-group>
```

---

## 🔒 Security Checklist

- [ ] DATABASE_URL is set in Azure (not committed to git)
- [ ] `.env` file is in `.gitignore`
- [ ] CORS origins are properly restricted in production
- [ ] TLS 1.2 minimum is enforced
- [ ] Always On is enabled (prevents cold starts)
- [ ] Azure PostgreSQL firewall is configured
- [ ] Health check endpoint (`/api/health`) is working
- [ ] Sensitive data is not logged

---

## 📞 Support Resources

- **Azure App Service Docs**: https://docs.microsoft.com/azure/app-service/
- **Node.js on Azure**: https://docs.microsoft.com/azure/app-service/configure-language-nodejs
- **Prisma with Azure**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-azure
- **GitHub Actions Azure Deploy**: https://github.com/Azure/webapps-deploy

---

## ✨ Success Indicators

Your deployment is successful when:

✅ GitHub Actions workflow completes without errors  
✅ Azure App Service shows "Running" status  
✅ Health check endpoint returns `{"status":"ok"}`  
✅ Frontend loads at `https://sparkx.azurewebsites.net`  
✅ API endpoints return data (not 500 errors)  
✅ No CORS errors in browser console  
✅ Database queries work correctly  
✅ Logs show "Server running on port 8080"

---

**Last Updated:** November 30, 2025  
**App Name:** sparkx  
**Region:** (Add your Azure region)  
**Node Version:** 24.x LTS
