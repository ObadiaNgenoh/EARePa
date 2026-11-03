#!/usr/bin/env python3
"""CLI script for ingesting papers into SkolarPulse."""
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.ingestion_service import ingestion_service
from src.models.schemas import PaperCreate
from src.models.database import init_db


def main():
    parser = argparse.ArgumentParser(description="Ingest a research paper into SkolarPulse")
    parser.add_argument("file_path", help="Path to PDF file")
    parser.add_argument("--title", help="Paper title")
    parser.add_argument("--authors", help="Comma-separated author names")
    parser.add_argument("--university", help="University name")
    parser.add_argument("--year", type=int, help="Publication year")
    parser.add_argument("--abstract", help="Paper abstract")
    parser.add_argument("--doi", help="DOI")
    parser.add_argument("--url", help="Paper URL")

    args = parser.parse_args()

    if not os.path.exists(args.file_path):
        print(f"Error: File not found: {args.file_path}")
        sys.exit(1)

    init_db()

    paper_data = PaperCreate(
        title=args.title or os.path.basename(args.file_path).replace(".pdf", ""),
        authors=[a.strip() for a in args.authors.split(",")] if args.authors else [],
        university=args.university or "Unknown",
        year=args.year or 2024,
        abstract=args.abstract,
        doi=args.doi,
        url=args.url
    )

    print(f"Ingesting: {paper_data.title}...")
    result = ingestion_service.ingest_paper(args.file_path, paper_data)
    print(f"Success! Paper ID: {result['paper_id']}, Chunks: {result['chunks_created']}")


if __name__ == "__main__":
    main()