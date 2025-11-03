import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageEditorImageList } from '../../components/ImageEditor/ImageEditorImageList';
import { EditedImage } from '../../types';

const mockEditedImages: EditedImage[] = [
  {
    id: 'edited-1',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Make the background blue',
    context: {},
    ai_model: 'runway-gen4-turbo',
    storage_path: 'user-uploads/user-1/project-1/edited-1.png',
    edited_url: 'https://example.com/edited-1.png',
    width: 1920,
    height: 1080,
    version: 1,
    parent_id: undefined,
    created_at: '2025-10-20T15:59:30.165+00:00',
  },
  {
    id: 'edited-2',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Add gradient background with vibrant colors',
    context: {},
    ai_model: 'flux-pro',
    storage_path: 'user-uploads/user-1/project-1/edited-2.png',
    edited_url: 'https://example.com/edited-2.png',
    width: 1920,
    height: 1080,
    version: 1,
    parent_id: undefined,
    created_at: '2025-10-20T16:00:00.165+00:00',
  },
];

describe('ImageEditorImageList', () => {
  const mockOnSelectImage = vi.fn();
  const mockOnEditImage = vi.fn();
  const mockOnNavigateToVideo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    render(
      <ImageEditorImageList
        editedImages={[]}
        isLoading={true}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    // Check for the loading spinner (Loader2 component)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state when no images', () => {
    render(
      <ImageEditorImageList
        editedImages={[]}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    expect(screen.getByText('No editing history yet')).toBeInTheDocument();
    expect(screen.getByText('Generated images will appear here')).toBeInTheDocument();
  });

  it('renders list of edited images', () => {
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    expect(screen.getByText('Editing History')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
    // Alt text is truncated to 30 characters
    expect(screen.getByAltText('Make the background blue')).toBeInTheDocument();
    // "Add gradient background with vibrant colors".substring(0, 30) = "Add gradient background with vi"
    // But wait, let's check what the actual substring is
    const secondImageAlt = mockEditedImages[1].prompt.substring(0, 30);
    expect(screen.getByAltText(secondImageAlt)).toBeInTheDocument();
  });

  it('shows selected image indicator', () => {
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId="edited-1"
        onSelectImage={mockOnSelectImage}
      />
    );

    const images = screen.getAllByRole('img');
    const firstImageContainer = images[0].closest('div');
    expect(firstImageContainer).toHaveClass('border-primary');
  });

  it('calls onSelectImage when image is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    const images = screen.getAllByRole('img');
    // Click on the container div (the one with cursor-pointer class)
    const imageContainer = images[0].closest('div.cursor-pointer');
    expect(imageContainer).toBeTruthy();
    if (imageContainer) {
      await user.click(imageContainer);
      expect(mockOnSelectImage).toHaveBeenCalledWith(mockEditedImages[0]);
    }
  });

  it('shows edit button on hover', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
        onEditImage={mockOnEditImage}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
    await user.hover(imageContainer);

    const editButton = screen.getByTitle('Edit this image');
    expect(editButton).toBeInTheDocument();
  });

  it('calls onEditImage when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
        onEditImage={mockOnEditImage}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
    await user.hover(imageContainer);

    // Wait for the button to appear
    const editButton = await screen.findByTitle('Edit this image');
    editButton.click();

    expect(mockOnSelectImage).toHaveBeenCalledWith(mockEditedImages[0]);
    expect(mockOnEditImage).toHaveBeenCalledWith(mockEditedImages[0]);
  });

  it('renders non-selectable items when onSelectImage is not provided', () => {
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div');
    expect(imageContainer).toHaveClass('cursor-default');
  });

  it('allows editing without selection handler', async () => {
    const user = userEvent.setup();

    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onEditImage={mockOnEditImage}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div')!;
    await user.hover(imageContainer);

    const editButton = await screen.findByTitle('Edit this image');
    editButton.click();

    expect(mockOnEditImage).toHaveBeenCalledWith(mockEditedImages[0]);
  });

  it('shows video button on hover when onNavigateToVideo is provided', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
        onNavigateToVideo={mockOnNavigateToVideo}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div')!;
    await user.hover(imageContainer);

    const videoButton = screen.getByTitle('Generate video from this image');
    expect(videoButton).toBeInTheDocument();
  });

  it('calls onNavigateToVideo when video button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
        onNavigateToVideo={mockOnNavigateToVideo}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
    await user.hover(imageContainer);

    // Wait for the button to appear
    const videoButton = await screen.findByTitle('Generate video from this image');
    
    // Click the button directly - the stopPropagation in the component should prevent div onClick
    videoButton.click();

    expect(mockOnNavigateToVideo).toHaveBeenCalledWith('edited-1');
  });

  it('does not show video button when onNavigateToVideo is not provided', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    const imageContainer = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
    await user.hover(imageContainer);

    expect(screen.queryByTitle('Generate video from this image')).not.toBeInTheDocument();
  });

  it('displays prompt preview for each image', () => {
    render(
      <ImageEditorImageList
        editedImages={mockEditedImages}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    // Prompts are truncated to 40 characters in the component
    expect(screen.getByText('Make the background blue')).toBeInTheDocument();
    expect(screen.getByText('Add gradient background with vibrant col')).toBeInTheDocument();
  });

  it('truncates long prompts in preview', () => {
    const longPromptImage: EditedImage = {
      ...mockEditedImages[0],
      prompt: 'A'.repeat(100), // Very long prompt
    };

    render(
      <ImageEditorImageList
        editedImages={[longPromptImage]}
        isLoading={false}
        selectedImageId={null}
        onSelectImage={mockOnSelectImage}
      />
    );

    // Check that the prompt is displayed (truncated to 40 characters)
    const truncatedPrompt = 'A'.repeat(40);
    const promptElement = screen.getByText(truncatedPrompt);
    expect(promptElement).toBeInTheDocument();
  });
});

