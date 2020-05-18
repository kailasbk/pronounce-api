# Pronounce API Reference
This file describes the behaviors of the routes in the API.

## `/image`
The `/image` route is used for getting and changing profile pictures

### `GET`
#### Request
Queries:
- q => the image resource locator (uuid)

#### Responses
- Code 200 => returns the image blob of type `image/jpeg`
- Code 404 => the image was not found

### `PUT`
#### Request
Queries:
- q => the image resource locator (uuid)

Headers:
- Authorization => the user's JWT bearer token

Body:
- the image sent as `multipart/form-data` encoded data

#### Responses
- Code 204 => the image was properly updated
- Code 401 -> the user is not authorized to update the image
- Code 404 => the image was not found

## `/audio`
The `/audio` route is used for getting and changing pronouncation audio

### `GET`
#### Request
Queries:
- q => the audio resource locator (uuid)

#### Responses
- Code 200 => returns the audio blob of type `audio/m4a`
- Code 404 => the audio was not found

### `PUT`
#### Request
Queries:
- q => the audio resource locator (uuid)

Headers:
- Authorization => the user's JWT bearer token

Body:
- the image sent as `multipart/form-data` encoded data

#### Responses
- Code 204 => the audio was properly updated
- Code 401 -> the user is not authorized to update the audio
- Code 404 => the audio was not found