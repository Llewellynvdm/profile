#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)"
PDF_SUPPORT_DIR="${SCRIPT_DIR}/pdf"
TEMPLATE_PATH="${PDF_SUPPORT_DIR}/cv-template.tex"
FILTER_PATH="${PDF_SUPPORT_DIR}/page-break.lua"
COVER_PHOTO="${PDF_SUPPORT_DIR}/assets/llewellyn-van-der-merwe.jpg"
OUTPUT_DIR="${REPOSITORY_ROOT}/public/documents"

for executable in pandoc xelatex pdfinfo pdftotext; do
  if ! command -v "${executable}" >/dev/null 2>&1; then
    printf 'Required executable not found: %s\n' "${executable}" >&2
    exit 1
  fi
done

for required_file in "${TEMPLATE_PATH}" "${FILTER_PATH}" "${COVER_PHOTO}"; do
  if [[ ! -f "${required_file}" ]]; then
    printf 'Required PDF build input not found: %s\n' "${required_file}" >&2
    exit 1
  fi
done

BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/profile-cv-pdf.XXXXXXXX")"
trap 'rm -rf -- "${BUILD_DIR}"' EXIT

extract_current_date() {
  local source_file="$1"
  local current_date

  current_date="$(sed -n 's/^\*\*Current to \(.*\)\*\*$/\1/p' "${source_file}" | head -n 1)"

  if [[ -z "${current_date}" ]]; then
    printf 'Unable to determine the current date from %s\n' "${source_file}" >&2
    exit 1
  fi

  printf '%s' "${current_date}"
}

prepare_executive_body() {
  local source_file="$1"
  local output_file="$2"

  awk '
    /<!-- PAGE BREAK -->/ && !started { started = 1; next }
    started { print }
  ' "${source_file}" > "${output_file}"
}

prepare_exhaustive_body() {
  local source_file="$1"
  local output_file="$2"

  awk '
    /^## Professional Profile$/ && !started {
      started = 1
      print "# Professional Profile"
      next
    }
    started { print }
  ' "${source_file}" > "${output_file}"
}

build_pdf() {
  local document_kind="$1"
  local source_file="$2"
  local prepared_body="$3"
  local temporary_pdf="$4"
  local title="$5"
  local edition="$6"
  local current_date

  current_date="$(extract_current_date "${source_file}")"

  pandoc "${prepared_body}" \
    --from='gfm+raw_html' \
    --standalone \
    --pdf-engine=xelatex \
    --template="${TEMPLATE_PATH}" \
    --lua-filter="${FILTER_PATH}" \
    --resource-path="${REPOSITORY_ROOT}:${REPOSITORY_ROOT}/sources:${PDF_SUPPORT_DIR}/assets" \
    --metadata="title:${title}" \
    --metadata="edition:${edition}" \
    --metadata="current-to:${current_date}" \
    --metadata="cover-photo:${COVER_PHOTO}" \
    --metadata="${document_kind}:true" \
    --output="${temporary_pdf}"

  pdfinfo "${temporary_pdf}" >/dev/null
  pdftotext "${temporary_pdf}" - >/dev/null
}

mkdir -p -- "${OUTPUT_DIR}"

EXECUTIVE_SOURCE="${REPOSITORY_ROOT}/sources/Executive_CV.md"
EXHAUSTIVE_SOURCE="${REPOSITORY_ROOT}/sources/Exhaustive_CV.md"
EXECUTIVE_BODY="${BUILD_DIR}/executive-body.md"
EXHAUSTIVE_BODY="${BUILD_DIR}/exhaustive-body.md"
EXECUTIVE_PDF="${BUILD_DIR}/executive.pdf"
EXHAUSTIVE_PDF="${BUILD_DIR}/exhaustive.pdf"

prepare_executive_body "${EXECUTIVE_SOURCE}" "${EXECUTIVE_BODY}"
prepare_exhaustive_body "${EXHAUSTIVE_SOURCE}" "${EXHAUSTIVE_BODY}"

build_pdf \
  executive \
  "${EXECUTIVE_SOURCE}" \
  "${EXECUTIVE_BODY}" \
  "${EXECUTIVE_PDF}" \
  'Llewellyn van der Merwe - Executive CV' \
  'Executive edition'

build_pdf \
  exhaustive \
  "${EXHAUSTIVE_SOURCE}" \
  "${EXHAUSTIVE_BODY}" \
  "${EXHAUSTIVE_PDF}" \
  'Llewellyn van der Merwe - Exhaustive CV' \
  'Exhaustive CV'

mv -- "${EXECUTIVE_PDF}" "${OUTPUT_DIR}/llewellyn-van-der-merwe-executive-cv.pdf"
mv -- "${EXHAUSTIVE_PDF}" "${OUTPUT_DIR}/llewellyn-van-der-merwe-exhaustive-cv.pdf"

printf 'Generated:\n  %s\n  %s\n' \
  "${OUTPUT_DIR}/llewellyn-van-der-merwe-executive-cv.pdf" \
  "${OUTPUT_DIR}/llewellyn-van-der-merwe-exhaustive-cv.pdf"
