# pas.yml

default to parallels

```
tasks:
    exec:
        pwd: [pwd]
        ls: [ls, -la]    
```

```
tasks:
    exec:
        pwd: 
            cwd: .
            cmd: [pwd]
        ls: [ls, -la]    
```


nested

```
tasks:
    exec:
        series: 
            type: series
            cmd:
                pwd: [pwd]
                ls: [ls, -la]    
```
