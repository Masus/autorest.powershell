/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Host } from '@microsoft.azure/autorest-extension-base';
import { Project } from '../project';
import { setIndentation, indent, guid, values } from '@microsoft.azure/codegen';
import { PsdFile } from '../file-formats/psd-file';

export async function generatePsd1(project: Project) {
  setIndentation(2);
  const psd1 = new PsdFile(await project.state.readFile(project.psd1));

  psd1.setRegion('definition', function* () {
    yield indent(`RootModule = '${project.psm1}'`);
    yield indent(`ModuleVersion = '${project.moduleVersion}'`);
    yield indent(`CompatiblePSEditions = 'Core', 'Desktop'`);
    const author = project.azure ? 'Microsoft Corporation' : project.metadata.authors;
    yield indent(`Author = '${author}'`);
    const companyName = project.azure ? 'Microsoft Corporation' : project.metadata.companyName;
    yield indent(`CompanyName = '${companyName}'`);
    const copyright = project.azure ? 'Microsoft Corporation. All rights reserved.' : project.metadata.copyright;
    yield indent(`Copyright = '${copyright}'`);
    const description = project.azure ? `Microsoft Azure PowerShell: ${project.serviceName} cmdlets` : project.metadata.description;
    yield indent(`Description = '${description}'`);
    yield indent(`PowerShellVersion = '5.1'`);
    yield indent(`DotNetFrameworkVersion = '4.7.2'`);
    yield indent(`RequiredAssemblies = '${project.dll}'`);
    yield indent(`FormatsToProcess = '${project.formatPs1xml}'`);
  }, false);

  if (!psd1.has('persistent data')) {
    psd1.setRegion('persistent data', function* () {
      yield indent(`GUID = '${guid()}'`);
    }, false);
  }

  psd1.setRegion('private data', function* () {
    yield indent(`PrivateData = @{`);
    yield indent(`PSData = @{`, 2);

    const tags = project.azure ? `'Azure', 'ResourceManager', 'ARM', '${project.serviceName}'` : `''`;
    yield indent(`Tags = ${tags}`, 3);
    const licenseUri = project.azure ? `https://aka.ms/azps-license` : '';
    yield indent(`LicenseUri = '${licenseUri}'`, 3);
    const projectUri = project.azure ? `https://github.com/Azure/azure-powershell` : '';
    yield indent(`ProjectUri = '${projectUri}'`, 3);
    yield indent(`ReleaseNotes = ''`, 3);
    if (project.azure && project.profiles.length) {
      const profiles = values(project.profiles)
        .linq.select(p => `'${p}'`)
        .linq.toArray().join(', ');
      yield indent(`Profiles = ${profiles}`, 3);
    }

    yield indent(`}`, 2);
    yield indent(`}`);
  }, false);

  project.state.writeFile(project.psd1, psd1.text, undefined, 'source-file-powershell');
}
