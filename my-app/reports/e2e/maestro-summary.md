# Maestro Status

- Mode: run
- Status: failed
- Reason: Maestro flows failed or were interrupted.
- Generated at: 2026-04-18T15:30:25.446Z
- CLI available: yes
- Flow files: 8
- Output log: reports\e2e\maestro-output.log

```text
C:\Users\LUAN\Downloads\expo_test\my-app>if "Windows_NT" == "Windows_NT" setlocal

C:\Users\LUAN\Downloads\expo_test\my-app>set DIRNAME=C:\maestro\maestro\bin\ 

C:\Users\LUAN\Downloads\expo_test\my-app>if "C:\maestro\maestro\bin\" == "" set DIRNAME=. 

C:\Users\LUAN\Downloads\expo_test\my-app>set APP_BASE_NAME=maestro 

C:\Users\LUAN\Downloads\expo_test\my-app>set APP_HOME=C:\maestro\maestro\bin\.. 

C:\Users\LUAN\Downloads\expo_test\my-app>for %i in ("C:\maestro\maestro\bin\..") do set APP_HOME=%~fi 

C:\Users\LUAN\Downloads\expo_test\my-app>set APP_HOME=C:\maestro\maestro 

C:\Users\LUAN\Downloads\expo_test\my-app>set DEFAULT_JVM_OPTS= 

C:\Users\LUAN\Downloads\expo_test\my-app>if defined JAVA_HOME goto findJavaFromJavaHome 

C:\Users\LUAN\Downloads\expo_test\my-app>set JAVA_EXE=java.exe 

C:\Users\LUAN\Downloads\expo_test\my-app>java.exe -version  1>NUL 2>&1 

C:\Users\LUAN\Downloads\expo_test\my-app>if 0 EQU 0 goto execute 

C:\Users\LUAN\Downloads\expo_test\my-app>set CLASSPATH=C:\maestro\maestro\lib\* 

C:\Users\LUAN\Downloads\expo_test\my-app>set JAVA_VERSION=0 

C:\Users\LUAN\Downloads\expo_test\my-app>for /F "tokens=*" %g in ('cmd /c ""java.exe" -classpath "C:\maestro\maestro\bin\*" JvmVersion"') do (set JAVA_VERSION=%g ) 

C:\Users\LUAN\Downloads\expo_test\my-app>(set JAVA_VERSION=21 ) 

C:\Users\LUAN\Downloads\expo_test\my-app>if 21 LSS 17 (
echo. 
 echo ERROR: Java 17 or higher is required.  
 echo. 
 echo Please update Java, then try again.  
 echo To check your Java version, run: java -version  
 echo. 
 echo See https://maestro.dev/blog/introducing-maestro-2-0-0 for more details.  
 goto fail 
) 

C:\Users\LUAN\Downloads\expo_test\my-app>"java.exe"     -classpath "C:\maestro\maestro\lib\*" maestro.cli.AppKt test maestro 
?????????????????????????????????????????????????????????????????????????????????????????????????
?                                                                                               ?
?   Get results faster by executing flows in parallel on Maestro Cloud virtual devices. Run:    ?
?   maestro cloud app_file flows_folder/                                                        ?
?                                                                                               ?
?????????????????????????????????????????????????????????????????????????????????????????????????


Waiting for flows to complete...
[Failed] app-launch-and-login-validation (12s) (Unable to launch app com.lehoangluan1.flexshiftmobile)
[Failed] employee-create-leave-request (4s) (Unable to launch app com.lehoangluan1.flexshiftmobile)
[Failed] employee-navigation-and-logout (6s) (Unable to launch app com.lehoangluan1.flexshiftmobile)
[Failed] login-and-claim-open-shift (5s) (Unable to launch app com.lehoangluan1.flexshiftmobile)
[Failed] manager-create-open-shift (6s) (Unable to launch app com.lehoangluan1.flexshiftmobile)
Exception in thread "pool-6-thread-1" java.io.IOException: Command failed (tcp:7001): closed
	at dadb.adbserver.AdbServer.send$dadb(AdbServer.kt:103)
	at dadb.adbserver.AdbServerDadb.open(AdbServer.kt:149)
	at dadb.forwarding.TcpForwarder.handleForwarding$lambda$1(TcpForwarder.kt:64)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1144)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:642)
	at java.base/java.lang.Thread.run(Thread.java:1583)
[Failed] manager-review-request (2m 1s) (Unable to launch app com.lehoangluan1.flexshiftmobile)
Exception in thread "pool-6-thread-3" java.io.IOException: Command failed (tcp:7001): closed
	at dadb.adbserver.AdbServer.send$dadb(AdbServer.kt:103)
	at dadb.adbserver.AdbServerDadb.open(AdbServer.kt:149)
	at dadb.forwarding.TcpForwarder.handleForwarding$lambda$1(TcpForwarder.kt:64)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1144)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:642)
	at java.base/java.lang.Thread.run(Thread.java:1583)
[Failed] offline-queue-smoke (2m) (Unable to launch app com.lehoangluan1.flexshiftmobile)

7/7 Flows Failed

Exception in thread "pool-6-thread-5" java.io.IOException: Command failed (tcp:7001): closed
	at dadb.adbserver.AdbServer.send$dadb(AdbServer.kt:103)
	at dadb.adbserver.AdbServerDadb.open(AdbServer.kt:149)
	at dadb.forwarding.TcpForwarder.handleForwarding$lambda$1(TcpForwarder.kt:64)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1144)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:642)
	at java.base/java.lang.Thread.run(Thread.java:1583)
??????????????????????????????????????????????????????????????????????????????????????????????????
?                                                                                                ?
?   Debug tests faster by easy access to test recordings, maestro logs, screenshots, and more.   ?
?                                                                                                ?
?   Run your flows on Maestro Cloud:                                                             ?
?   maestro cloud app_file flows_folder/                                                         ?
?                                                                                                ?
??????????????????????????????????????????????????????????????????????????????????????????????????


C:\Users\LUAN\Downloads\expo_test\my-app>if 1 EQU 0 goto mainEnd 

C:\Users\LUAN\Downloads\expo_test\my-app>rem Set variable MAESTRO_EXIT_CONSOLE if you need the _script_ return code instead of 

C:\Users\LUAN\Downloads\expo_test\my-app>rem the _cmd.exe /c_ return code! 

C:\Users\LUAN\Downloads\expo_test\my-app>set EXIT_CODE=1 

C:\Users\LUAN\Downloads\expo_test\my-app>if 1 EQU 0 set EXIT_CODE=1 

C:\Users\LUAN\Downloads\expo_test\my-app>if not "" == "" exit 1 

C:\Users\LUAN\Downloads\expo_test\my-app>exit /b 1
```
