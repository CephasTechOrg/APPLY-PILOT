from typing import Tuple

import requests
from fastapi import HTTPException, status

from app.core.config import settings


SYSTEM_PROMPT = (
	"You are an expert career assistant. Provide clear, professional, concise output. "
	"Use bullet points where helpful."
)


def _call_deepseek(prompt: str, temperature: float = 0.3) -> Tuple[str, int | None]:
	if not settings.DEEPSEEK_API_KEY:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="AI provider not configured. Set DEEPSEEK_API_KEY.",
		)

	payload = {
		"model": "deepseek-chat",
		"messages": [
			{"role": "system", "content": SYSTEM_PROMPT},
			{"role": "user", "content": prompt},
		],
		"temperature": temperature,
	}

	try:
		response = requests.post(
			settings.DEEPSEEK_API_URL,
			headers={
				"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
				"Content-Type": "application/json",
			},
			json=payload,
			timeout=60,
		)
	except requests.RequestException as exc:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail=f"AI provider unavailable: {exc}",
		)

	if response.status_code >= 400:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail=f"AI provider error: {response.text}",
		)

	try:
		data = response.json()
	except ValueError:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="AI provider returned invalid JSON",
		)
	content = data.get("choices", [{}])[0].get("message", {}).get("content")
	if not content:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="AI provider returned empty response",
		)

	usage = data.get("usage") or {}
	tokens = usage.get("total_tokens")
	return content, tokens


def build_tailor_resume_prompt(resume_text: str, job_description: str, instructions: str | None) -> str:
	extras = f"\nAdditional instructions: {instructions.strip()}" if instructions else ""
	return (
		"Tailor the resume to the job description. Provide: \n"
		"1) Tailored summary\n2) Key skills alignment\n3) Suggested bullet improvements\n"
		f"\nResume:\n{resume_text}\n\nJob Description:\n{job_description}{extras}"
	)


def build_cover_letter_prompt(resume_text: str, job_description: str, tone: str | None, instructions: str | None) -> str:
	tone_line = f"Tone: {tone}." if tone else ""
	extras = f"\nAdditional instructions: {instructions.strip()}" if instructions else ""
	return (
		"Write a tailored cover letter (3-5 short paragraphs). "
		f"{tone_line}\n"
		f"\nResume:\n{resume_text}\n\nJob Description:\n{job_description}{extras}"
	)


def build_ats_checklist_prompt(resume_text: str, job_description: str, instructions: str | None) -> str:
	extras = f"\nAdditional instructions: {instructions.strip()}" if instructions else ""
	return (
		"Create an ATS checklist. Provide: \n"
		"1) Missing keywords\n2) Matching keywords\n3) Top improvement actions (max 6)\n"
		f"\nResume:\n{resume_text}\n\nJob Description:\n{job_description}{extras}"
	)


def generate_tailored_resume(resume_text: str, job_description: str, instructions: str | None) -> Tuple[str, int | None]:
	prompt = build_tailor_resume_prompt(resume_text, job_description, instructions)
	return _call_deepseek(prompt, temperature=0.2)


def generate_cover_letter(resume_text: str, job_description: str, tone: str | None, instructions: str | None) -> Tuple[str, int | None]:
	prompt = build_cover_letter_prompt(resume_text, job_description, tone, instructions)
	return _call_deepseek(prompt, temperature=0.3)


def generate_ats_checklist(resume_text: str, job_description: str, instructions: str | None) -> Tuple[str, int | None]:
	prompt = build_ats_checklist_prompt(resume_text, job_description, instructions)
	return _call_deepseek(prompt, temperature=0.2)


# ============================================
# Email Parsing for Application Events
# ============================================

EMAIL_PARSE_SYSTEM_PROMPT = """You are an expert at analyzing job application emails. Your task is to:
1. Classify the email type (confirmation, interview request, offer, rejection, etc.)
2. Extract key information (dates, deadlines, requirements)
3. Determine if action is required
4. Suggest the appropriate application status

Always respond in valid JSON format."""


def build_email_parse_prompt(email_content: str, additional_context: str | None, company: str | None, job_title: str | None) -> str:
	context_line = ""
	if company or job_title:
		context_line = f"\nApplication Context: {job_title or 'Position'} at {company or 'Company'}"
	if additional_context:
		context_line += f"\nAdditional Context: {additional_context}"
	
	return f"""Analyze this job application email and extract structured information.

Email Content:
---
{email_content}
---
{context_line}

Respond with a JSON object containing:
{{
  "event_type": "confirmation" | "interview_scheduled" | "interview_completed" | "assessment" | "offer" | "rejection" | "request" | "follow_up" | "other",
  "summary": "Brief 1-2 sentence summary of the email",
  "suggested_status": "saved" | "applied" | "interview" | "offer" | "rejected" | null,
  "confidence": 0.0-1.0 (how confident you are in the classification),
  "extracted_dates": [
    {{"date": "YYYY-MM-DD", "time": "HH:MM" or null, "description": "what this date is for", "is_deadline": true/false}}
  ],
  "key_details": ["list of important points from the email"],
  "next_steps": ["suggested actions for the applicant"],
  "action_required": true/false,
  "action_description": "what action is needed (if any)",
  "action_deadline": "YYYY-MM-DD" or null
}}

Be precise with dates. If a date is mentioned, extract it. If time is mentioned, include it.
For interviews, always mark action_required as true.
For rejections, suggested_status should be "rejected".
For offers, suggested_status should be "offer".
"""


def parse_email_content(
	email_content: str,
	additional_context: str | None = None,
	company: str | None = None,
	job_title: str | None = None
) -> Tuple[dict, int | None]:
	"""
	Parse email content using AI to extract structured event information.
	
	Returns a tuple of (parsed_data, tokens_used).
	"""
	import json
	
	prompt = build_email_parse_prompt(email_content, additional_context, company, job_title)
	
	# Use a dedicated call with email parsing system prompt
	if not settings.DEEPSEEK_API_KEY:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="AI provider not configured. Set DEEPSEEK_API_KEY.",
		)
	
	payload = {
		"model": "deepseek-chat",
		"messages": [
			{"role": "system", "content": EMAIL_PARSE_SYSTEM_PROMPT},
			{"role": "user", "content": prompt},
		],
		"temperature": 0.1,  # Low temperature for consistent extraction
		"response_format": {"type": "json_object"},  # Request JSON output
	}
	
	try:
		response = requests.post(
			settings.DEEPSEEK_API_URL,
			headers={
				"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
				"Content-Type": "application/json",
			},
			json=payload,
			timeout=60,
		)
	except requests.RequestException as exc:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail=f"AI provider unavailable: {exc}",
		)
	
	if response.status_code >= 400:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail=f"AI provider error: {response.text}",
		)
	
	try:
		data = response.json()
	except ValueError:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="AI provider returned invalid JSON",
		)
	
	content = data.get("choices", [{}])[0].get("message", {}).get("content")
	if not content:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="AI provider returned empty response",
		)
	
	usage = data.get("usage") or {}
	tokens = usage.get("total_tokens")
	
	# Parse the JSON response
	try:
		parsed = json.loads(content)
	except json.JSONDecodeError:
		# Try to extract JSON from the response
		import re
		json_match = re.search(r'\{[\s\S]*\}', content)
		if json_match:
			try:
				parsed = json.loads(json_match.group())
			except json.JSONDecodeError:
				raise HTTPException(
					status_code=status.HTTP_502_BAD_GATEWAY,
					detail="AI returned invalid JSON structure",
				)
		else:
			raise HTTPException(
				status_code=status.HTTP_502_BAD_GATEWAY,
				detail="AI returned non-JSON response",
			)
	
	return parsed, tokens

