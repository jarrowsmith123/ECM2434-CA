from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer, UserProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        if serializer.errors:
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_409_CONFLICT
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e: # need to add logging and make this do it properly because printing exceptions is yucky
        return Response(
            {'error': 'An unexpected error occurred during registration.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        if request.method == 'GET':
            serializer = UserProfileSerializer(request.user.profile)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = UserProfileSerializer(request.user.profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except AttributeError:
        logger.error(f"Profile access error for user {request.user.id}: User has no profile", exc_info=True)
        return Response(
            {'error': 'User profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Profile update error for user {request.user.id}: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request):
    try:
        user = request.user
        user.delete()
        return Response(
            {'message': 'account deleted'},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        return Response(
            {'error': 'failed to delete account'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
