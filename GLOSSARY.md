# Penny Portfolio

A private photo archive. One owner keeps albums of photos, and guests look at the albums the owner has not made private.

## Language

### People

**Owner**:
The one person who keeps the archive and the only one who can change it.
_Avoid_: Admin, user, author

**Guest**:
Anyone looking at the archive who is not the owner. A guest only reads.
_Avoid_: Visitor, viewer, public user

### Content

**Album**:
A titled set of photos from one event, with a cover, a date and a description.
_Avoid_: Gallery, collection, set

**Photo**:
One image in an album, with a title and the owner's note.
_Avoid_: Picture, image, asset

**Note**:
The owner's text about one photo. Guests can read it, and only the owner writes it.
_Avoid_: Caption, comment, description

**Private album**:
An album only the owner can see. Every new album starts private.
_Avoid_: Hidden album, draft

**Public album**:
An album guests can see, once they are past the gate.
_Avoid_: Shared album, published album

### Access

**Gate**:
The shared password a guest enters before seeing any page. It slows down strangers and does not protect private albums.
_Avoid_: Lock, login, guest login
