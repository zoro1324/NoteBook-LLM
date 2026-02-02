from django.urls import path, include
from rest_framework.routers import DefaultRouter

from chat.views import NotebookViewSet, ConversationViewSet, ChatViewSet
from documents.views import DocumentViewSet, NotebookGuideViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'notebooks', NotebookViewSet, basename='notebook')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'guides', NotebookGuideViewSet, basename='guide')
router.register(r'chat', ChatViewSet, basename='chat')

urlpatterns = [
    path('', include(router.urls)),
]
