# PAS DOCUMENTATION

## Tasks: 

- [init](./tasks/init.md)

## Provider

Provider adalah sebuah entitas yang mengatur cara sebuah pack di-fetch dari origin-nya.

Sebuah url yang merupakan identifier dari pack. URL ini akan di-consult dengan provider untuk menentukan pack yang bisa di-fetch. Dari operasi ini akan dihasilkan sebuah instance dari pack

Pack kemudian akan melakukan pull jika pack tersebut bukan working path, lalu akan melakukan secara urut, pre-install, install, post-install. Hal yang menentukan bagaimana sebuah pack di pre-install, install dan post-install adalah profile

- fetch 
  Kegiatan melakukan pengambilan resource dari origin provider ke local cache
- install
  Kegiatan melakukan copy dari local cache ke working pack dan kemudian melakukan hal-hal yang perlu dilakukan untuk install seperti 

## Lifecycle

- init
- install
    + fetch
    + pre-install
    + install
    + post-install
- deploy
- up