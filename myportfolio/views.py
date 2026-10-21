from django.conf import settings
from django.core.mail import send_mail
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods

def home(request):
	return render(request, 'myportfolio/home.html')

@require_http_methods(["GET", "POST"])
def contact(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        sender_email = request.POST.get("email", "").strip()
        subject = request.POST.get("subject", "").strip()
        body = request.POST.get("message", "").strip()

        if not all([name, sender_email, subject, body]):
            messages.error(request, "Please complete all fields before sending.")
            return redirect("contact")

        email_subject = f"Portfolio contact: {subject}"
        email_body = (
            f"Name: {name}\n"
            f"Email: {sender_email}\n\n"
            f"Message:\n{body}"
        )

        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_EMAIL],
                fail_silently=False,
                reply_to=[sender_email],
            )
        except Exception:
            logging.exeption("Portfolio contact email failed.")
            messages.error(request, "Your message could not be sent right now. Please email me directly.")
        else:
            messages.success(request, "Thanks! Your message has been sent.")
        return redirect("contact")

    return render(request, "myportfolio/contact.html")
