Option Explicit

Dim shell, fileSystem, projectFolder, batchPath, logPath, quote, innerCommand

Set shell = CreateObject("WScript.Shell")
Set fileSystem = CreateObject("Scripting.FileSystemObject")

projectFolder = fileSystem.GetParentFolderName(WScript.ScriptFullName)
batchPath = fileSystem.BuildPath(projectFolder, "INICIAR_KAKA_CUT.bat")
logPath = fileSystem.BuildPath(projectFolder, "KAKA_CUT_INICIO.log")
quote = Chr(34)

shell.CurrentDirectory = projectFolder
innerCommand = quote & batchPath & quote & " > " & quote & logPath & quote & " 2>&1"

' Executa o preparador oculto; somente a janela do Kaka Cut fica visivel.
shell.Run "cmd.exe /d /c " & quote & innerCommand & quote, 0, False
