// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider } from '../src/contexts/AuthContext.tsx';
import { LoginPage } from '../src/pages/LoginPage.tsx';
import { Module1Evolution } from '../src/modules/Module1Evolution.tsx';
import { VirtualDesktop } from '../src/simulations/VirtualDesktop.tsx';
import { FileManagerApp } from '../src/simulations/apps/FileManagerApp.tsx';
import { RealEquipmentPhotos } from '../src/components/RealEquipmentPhotos.tsx';
import { SimFile } from '../src/types/index.ts';

describe('ICT Made Easy UI Component Tests', () => {
  it('renders LoginPage with sign-in form and demo account quick-fill controls', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByText(/Sign in to ICT Made Easy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email or Username/i)).toBeInTheDocument();

    const demoPupilBtn = screen.getByText(/Pupil \(Grade 8A\)/i);
    fireEvent.click(demoPupilBtn);
    expect((screen.getByLabelText(/Email or Username/i) as HTMLInputElement).value).toBe(
      'pupil@virtuolab.edu.zm'
    );
  });

  it('renders Module 1 Evolution interactive Abacus and Generations comparison', () => {
    render(<Module1Evolution />);
    expect(screen.getByText(/Interactive Abacus Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/243/)).toBeInTheDocument();

    const compareBtn = screen.getByText(/Compare All Generations/i);
    fireEvent.click(compareBtn);
    expect(screen.getByText(/ENIAC/i)).toBeInTheDocument();
  });

  it('starts VirtualDesktop powered off and boots via the interactive Power Button', () => {
    const actionsSpy = vi.fn();
    render(
      <AuthProvider>
        <VirtualDesktop onActionsChange={actionsSpy} />
      </AuthProvider>
    );

    const bootBtn = screen.getByRole('button', { name: /Press Power Button to Boot PC/i });
    expect(bootBtn).toBeInTheDocument();

    fireEvent.click(bootBtn);
    expect(screen.getByText(/ICT MADE EASY BIOS \/ UEFI POST v2.4/i)).toBeInTheDocument();
    expect(actionsSpy).toHaveBeenCalled();
    expect(actionsSpy.mock.calls[0][0][0].type).toBe('BOOT_PC');
  });

  it('supports FileManagerApp file security actions: Properties inspector and Encryption', () => {
    const sampleFile: SimFile = {
      id: 'file-1',
      desktopStateId: 'state-1',
      folderId: null,
      name: 'Exam_Marks',
      fileType: 'document',
      extension: '.vdoc',
      contentJson: JSON.stringify({ plainText: 'Confidential student grades' }),
      sizeBytes: 128,
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };

    const updateSpy = vi.fn(async () => {});
    const noop = async () => {};

    render(
      <FileManagerApp
        mode="explorer"
        folders={[]}
        files={[sampleFile]}
        clipboard={null}
        onSetClipboard={() => {}}
        onCreateFolder={noop}
        onRenameFolder={noop}
        onDeleteFolder={noop}
        onRestoreFolder={noop}
        onCreateFile={noop}
        onUpdateFileContent={updateSpy}
        onRenameFile={noop}
        onMoveFile={noop}
        onCopyFileToFolder={noop}
        onDeleteFile={noop}
        onRestoreFile={noop}
        onEmptyRecycleBin={noop}
        onOpenFile={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Exam_Marks'));
    fireEvent.click(screen.getByRole('button', { name: /Properties/i }));
    expect(screen.getByText(/Readable Data Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidential student grades/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Encrypt \(\.enc\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /Encrypt File/i }));
    expect(updateSpy).toHaveBeenCalledWith(
      'file-1',
      expect.objectContaining({
        name: 'Exam_Marks_encrypted',
        extension: '.enc',
      })
    );
  });

  it('renders RealEquipmentPhotos hardware slots for mouse, keyboard, and lab equipment', () => {
    render(<RealEquipmentPhotos />);
    expect(screen.getByText(/Real Equipment Photo Showcase/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Computer Mouse/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Computer Keyboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Monitor \(Visual Display Unit\)/i).length).toBeGreaterThan(0);
  });
});
