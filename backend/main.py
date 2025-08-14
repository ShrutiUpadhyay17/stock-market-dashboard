import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()
# Allow the frontend (localhost:5500) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for testing, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# List of companies and their Yahoo Finance symbols
companies = {
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "RELIANCE": "RELIANCE.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS",
    "ITC": "ITC.NS",
    "BHARTIARTL": "BHARTIARTL.NS",
    "LT": "LT.NS",
    "BAJFINANCE": "BAJFINANCE.NS"
}

@app.get("/companies")
def get_companies():
    """Return list of available companies."""
    return list(companies.keys())

@app.get("/stock/{symbol}")
def get_stock(symbol: str):
    if symbol not in companies:
        raise HTTPException(status_code=404, detail="Company not found")

    ticker = companies[symbol]
    print(f"Fetching data for: {ticker}")

    try:
        data = yf.download(ticker, period="1mo", interval="1d")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"yfinance error: {str(e)}")

    if data.empty:
        raise HTTPException(status_code=404, detail="No stock data found")

    # Handle multi-index columns if present
    if isinstance(data.columns, pd.MultiIndex):
        close_prices = data["Close"][ticker].round(2).tolist()
        high_prices = data["High"][ticker].round(2).tolist()
        low_prices = data["Low"][ticker].round(2).tolist()
        volumes = data["Volume"][ticker].astype(int).tolist()
    else:
        close_prices = data["Close"].round(2).tolist()
        high_prices = data["High"].round(2).tolist()
        low_prices = data["Low"].round(2).tolist()
        volumes = data["Volume"].astype(int).tolist()

    return {
        "dates": data.index.strftime("%Y-%m-%d").tolist(),
        "close": close_prices,
        "high": high_prices,
        "low": low_prices,
        "volume": volumes
    }




