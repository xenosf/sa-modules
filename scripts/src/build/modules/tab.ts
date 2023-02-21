import { parse } from 'acorn';
import { generate } from 'astring';
import chalk from 'chalk';
import { type OutputFile, build as esbuild } from 'esbuild';
import type {
  BlockStatement,
  ExpressionStatement,
  FunctionExpression,
  Identifier,
  Literal,
  MemberExpression,
  Program,
  ReturnStatement,
  VariableDeclaration,
} from 'estree';
import fs from 'fs/promises';
import uniq from 'lodash/uniq.js';
import pathlib from 'path';

import { printList } from '../../scriptUtils.js';
import {
  copyManifest,
  createBuildCommand,
  exitOnError,
  logResult,
  retrieveTabs,
  tabNameExpander,
} from '../buildUtils.js';
import type { LintCommandInputs } from '../prebuild/eslint.js';
import { prebuild } from '../prebuild/index.js';
import type { BuildCommandInputs, BuildOptions, BuildResult, UnreducedResult } from '../types';

import { esbuildOptions, requireCreator } from './moduleUtils.js';

/**
 * Imports that are provided at runtime
 */
const externals = {
  'react': '_react',
  'react-dom': 'ReactDOM',
};

const outputTab = async (tabName: string, text: string, outDir: string): Promise<Omit<BuildResult, 'elapsed'>> => {
  try {
    const parsed = parse(text, { ecmaVersion: 6 }) as unknown as Program;
    const declStatement = parsed.body[1] as VariableDeclaration;

    const newTab = {
      type: 'ExpressionStatement',
      expression: {
        type: 'FunctionExpression',
        params: uniq(Object.values(externals))
          .map((name) => ({
            type: 'Identifier',
            name,
          }) as Identifier),
        body: {
          type: 'BlockStatement',
          body: [
            requireCreator(externals),
            {
              type: 'ReturnStatement',
              argument: {
                type: 'MemberExpression',
                object: declStatement.declarations[0].init,
                property: {
                  type: 'Literal',
                  value: 'default',
                } as Literal,
                computed: true,
              } as MemberExpression,
            } as ReturnStatement,
          ],
        } as BlockStatement,
      } as FunctionExpression,
    } as ExpressionStatement;

    let newCode = generate(newTab);
    if (newCode.endsWith(';')) newCode = newCode.slice(0, -1);

    const outFile = `${outDir}/tabs/${tabName}.js`;
    await fs.writeFile(outFile, newCode);
    const { size } = await fs.stat(outFile);
    return {
      severity: 'success',
      fileSize: size,
    };
  } catch (error) {
    return {
      severity: 'error',
      error,
    };
  }
};

export const buildTabs = async (tabs: string[], { srcDir, outDir }: BuildOptions) => {
  const { outputFiles } = await esbuild({
    ...esbuildOptions,
    entryPoints: tabs.map(tabNameExpander(srcDir)),
    outbase: outDir,
    outdir: outDir,
    external: Object.keys(externals),
    jsx: 'transform',
  });
  return outputFiles;
};

export const reduceTabOutputFiles = (outputFiles: OutputFile[], startTime: number, outDir: string) => Promise.all(outputFiles.map(async ({ path, text }) => {
  const [rawType, name] = path.split(pathlib.sep)
    .slice(-3, -1);

  if (rawType !== 'tabs') {
    throw new Error(`Expected only tabs, got ${rawType}`);
  }

  const result = await outputTab(name, text, outDir);
  return ['tab', name, {
    elapsed: performance.now() - startTime,
    ...result,
  }] as UnreducedResult;
}));

const getBuildTabsCommand = () => createBuildCommand('tabs', true)
  .argument('[tabs...]', 'Manually specify which tabs to build', null)
  .description('Build only tabs')
  .action(async (tabsOpt: string[] | null, { manifest, ...opts }: BuildCommandInputs & LintCommandInputs) => {
    const tabs = await retrieveTabs(manifest, tabsOpt);

    await prebuild(opts, {
      tabs,
      bundles: [],
    });

    printList(`${chalk.magentaBright('Building the following tabs:')}\n`, tabs);
    const startTime = performance.now();
    const [reducedRes] = await Promise.all([
      buildTabs(tabs, opts)
        .then((results) => reduceTabOutputFiles(results, startTime, opts.outDir)),
      copyManifest({
        outDir: opts.outDir,
        manifest,
      }),
    ]);
    logResult(reducedRes, opts.verbose);
    exitOnError(reducedRes);
  });


export default getBuildTabsCommand;
