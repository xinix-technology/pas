pas - another package management and automation
===============================================

[![License](http://img.shields.io/npm/l/pas.svg?style=flat-square)](https://github.com/xinix-technology/pas/blob/master/LICENSE)
[![Download](http://img.shields.io/npm/dm/pas.svg?style=flat-square)](https://github.com/xinix-technology/pas)
[![NPM](http://img.shields.io/npm/v/pas.svg?style=flat-square)](https://github.com/xinix-technology/pas)

The main goal of "pas" is to make sure application developers life easier. There are many tools outside there, generators, build tools, automation tools, and package management. Many of them are interoperable to each others. But using too many tools on your belt for developing application is not easy. Not for my friends I've known. 

If you working with javascript client side, node.js, php, or other platform. You will see each of them have their own thing to accomplished their job. Bower for client side javascript, npm for node.js, composer for php, maven for java, you named it! Unfortunately for many of us have to deal with more than one kind. You will not be web developer if you don't do javascript and php or other server side programming. Sometimes my colleagues get confused and tend to afraid to use another new tools.

"pas" is (another) package management and automation. We use it regularly at our organization, Xinix Technology. The aim of this tool is to help developers to manage their work cycle of applications that they build.

Todays, developers can use "pas" to help them at php. But in a very short time we can expect that it will be usable for many platform and programming languages. Nowadays we used "pas" internally as an alternative of composer on php developments.

Todays, Several tasks that will be easier by using "pas" are:

- Project initialization with plain archetype from github
- Project initialization from your earlier works.
- One command call to manage library dependencies for php (replacing composer).

## How to Install

You need node.js to install "pas". If you already have node.js and npm in your system, execute:

```
npm install -g pas
```

As it will be installing "pas" globally, you might have to execute as root or using sudo.

## How to Init New Project

Archetype is a scaffolding concept to use your earlier work or single package as your base project.  

```
pas init [archetype-name] [directory-name]
```

example,

```
pas init reekoheek/bono-arch a-new-web-app
```



------------------------------------
// scrap from earlier version, pax

- Inisialisasi proyek dengan menggunakan archetype yang telah ada
- Inisialisasi proyek dengan menggunakan proyek lain sebagai archetype
- Satu perintah untuk mengatur ketergantungan pustaka baik itu PHP (composer) maupun Javascript (bower atau npm).
- Menjalankan server development secara internal.
- Mengatur script untuk melakukan migrasi antar versi

## Archetype

Archetype adalah sebuah konsep scaffolding dari template proyek. Hal ini dapat membantu anda untuk memulai sebuah proyek.

## Bagaimana cara melakukan sesuatu?

Kami menginginkan developer dapat untuk menggunakan pas secara intuitif seperti saat mereka menggunakan npm, bower, composer, dll.

### Inisialisasi proyek

Perintah inisialisasi sedikit berbeda dari npm, bower atau pun composer. Karena pas memiliki archetype untuk melakukan scaffolding pada proyek anda. Pada saat menjalankan perintah init, argumen ke-3 dari perintah ini adalah nama archetype yang ingin digunakan. Selain itu argumen ke-3 ini juga bisa berupa url dari git.

```bash
pas init $ARCHETYPE_URL [$DIRECTORY]
```

### Melakukan tugas tertentu

-- REMOVED FOR REVIEW LATER --

Perintah "task" akan menampilkan tugas-tugas yang ada yang bisa dilakukan dalam sebuah skup proyek tertentu. Untuk menambah tugas-tugas yang baru dapat dilakukan dengan menambah scripting pada file pasfile.js di direktori proyek anda.

-- /REMOVED FOR REVIEW LATER --

```bash
cd $PROJECT_DIR
pas task
```
