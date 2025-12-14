from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, emails, dashboard

app = FastAPI(title="Email Auto-Routing System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"status": "Email Auto-Routing API running"}

@app.get("/health")
def health():
    return {"status": "healthy"}